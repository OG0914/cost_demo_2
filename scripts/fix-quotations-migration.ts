/**
 * 修复 quotations 表迁移
 * 处理旧库数据质量问题，填充默认值
 */

import { Client } from 'pg';
import { intToUuid, getForeignKeyUuid } from './uuid-converter.js';

const OLD_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'cost_analysis',
  user: 'postgres',
  password: '1998',
};

const NEW_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'cost_analysis_v2',
  user: 'postgres',
  password: '1998',
};

// 默认值
const DEFAULTS = {
  CUSTOMER_ID: '00000000-0000-0000-0000-000000000001',
  PACKAGING_CONFIG_ID: '00000000-0000-0000-0000-000000000002',
  SHIPPING_TYPE: 'fcl20',
  SALE_TYPE: 'domestic',
  MATERIAL_COST: 0,
  PACKAGING_COST: 0,
  PROCESS_COST: 0,
  SHIPPING_COST: 0,
  ADMIN_FEE: 0,
  VAT: 0,
  STATUS: 'draft',
};

async function fixMigration() {
  const oldClient = new Client(OLD_DB_CONFIG);
  const newClient = new Client(NEW_DB_CONFIG);

  try {
    await oldClient.connect();
    await newClient.connect();

    console.log('开始修复 quotations 表迁移...\n');

    // 1. 确保默认客户存在
    console.log('1. 检查/创建默认客户...');
    const adminResult = await newClient.query(
      `SELECT id FROM users WHERE username = 'admin' LIMIT 1`
    );
    const adminId = adminResult.rows[0]?.id;

    await newClient.query(`
      INSERT INTO customers (id, code, name, region, created_by, updated_by, created_at, updated_at)
      VALUES ($1, 'UNKNOWN', '未指定客户', 'Unknown', $2, $2, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW(),
        updated_by = $2
    `, [DEFAULTS.CUSTOMER_ID, adminId]);
    console.log('   ✓ 默认客户已就绪\n');

    // 2. 确保默认包装配置存在
    console.log('2. 检查/创建默认包装配置...');
    const defaultModelResult = await newClient.query(
      `SELECT id FROM models LIMIT 1`
    );
    const defaultModelId = defaultModelResult.rows[0]?.id;

    if (defaultModelId) {
      await newClient.query(`
        INSERT INTO packaging_configs (id, model_id, name, packaging_type, per_box, per_carton, created_at, updated_at)
        VALUES ($1, $2, '默认配置', 'standard', 1, 1, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [DEFAULTS.PACKAGING_CONFIG_ID, defaultModelId]);
      console.log('   ✓ 默认包装配置已就绪\n');
    }

    // 3. 读取旧库数据
    console.log('3. 读取旧库 quotations 数据...');
    const oldData = await oldClient.query(`
      SELECT * FROM quotations ORDER BY id
    `);
    console.log(`   ✓ 读取 ${oldData.rows.length} 条记录\n`);

    // 4. 迁移每条记录
    console.log('4. 开始迁移记录...');
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of oldData.rows) {
      try {
        // 构建UUID映射
        const id = intToUuid('quotations', row.id);
        const regulationId = row.regulation_id ? getForeignKeyUuid('regulations', row.regulation_id) : null;
        const modelId = row.model_id ? getForeignKeyUuid('models', row.model_id) : null;
        const packagingConfigId = row.packaging_config_id
          ? getForeignKeyUuid('packaging_configs', row.packaging_config_id)
          : DEFAULTS.PACKAGING_CONFIG_ID;
        const createdBy = row.created_by ? getForeignKeyUuid('users', row.created_by) : adminId;
        const reviewedBy = row.reviewed_by ? getForeignKeyUuid('users', row.reviewed_by) : null;

        // 尝试通过 customer_name 匹配客户
        let customerId = DEFAULTS.CUSTOMER_ID;
        if (row.customer_name) {
          const customerMatch = await newClient.query(`
            SELECT id FROM customers
            WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)
            LIMIT 1
          `, [row.customer_name.trim()]);
          if (customerMatch.rows.length > 0) {
            customerId = customerMatch.rows[0].id;
          }
        }

        // 字段值转换
        const saleType = row.sales_type?.toLowerCase() === 'export' ? 'export' : 'domestic';

        // shipping_type 转换（处理 fcl_20/fcl_40 等格式）
        let shippingType = DEFAULTS.SHIPPING_TYPE;
        const rawShipping = row.shipping_method?.toLowerCase().replace(/_/g, '') || '';
        if (rawShipping === 'fcl20' || rawShipping === '20') shippingType = 'fcl20';
        else if (rawShipping === 'fcl40' || rawShipping === '40') shippingType = 'fcl40';
        else if (rawShipping === 'lcl') shippingType = 'lcl';
        else if (rawShipping === 'air') shippingType = 'lcl';
        else if (rawShipping === 'sea') shippingType = 'fcl20';

        const status = row.status?.toLowerCase() || DEFAULTS.STATUS;

        // 插入新库
        await newClient.query(`
          INSERT INTO quotations (
            id, quotation_no, customer_id, regulation_id, model_id, packaging_config_id,
            sale_type, shipping_type, quantity, material_cost, packaging_cost, process_cost,
            shipping_cost, admin_fee, vat, total_cost, status, created_by, created_at,
            updated_at, reviewed_by, reviewed_at, review_note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            updated_at = NOW()
        `, [
          id,
          row.quotation_no,
          customerId,
          regulationId,
          modelId,
          packagingConfigId,
          saleType,
          shippingType,
          row.quantity || 0,
          row.base_cost || DEFAULTS.MATERIAL_COST,
          DEFAULTS.PACKAGING_COST,  // 旧库无此字段
          DEFAULTS.PROCESS_COST,    // 旧库无此字段
          row.freight_total || DEFAULTS.SHIPPING_COST,
          row.overhead_price || DEFAULTS.ADMIN_FEE,
          row.vat_rate || DEFAULTS.VAT,
          row.final_price || 0,
          status,
          createdBy,
          row.created_at,
          row.updated_at,
          reviewedBy,
          row.reviewed_at,
          row.batch_remark || null,
        ]);

        successCount++;
        process.stdout.write(`   进度: ${successCount}/${oldData.rows.length}\r`);
      } catch (err: any) {
        errorCount++;
        errors.push(`记录 ${row.id}: ${err.message}`);
        console.log(`   ✗ 记录 ${row.id} 失败: ${err.message}`);
      }
    }

    console.log(`\n   ✓ 成功: ${successCount}, 失败: ${errorCount}\n`);

    // 5. 验证结果
    console.log('5. 验证迁移结果...');
    const newCount = await newClient.query(`SELECT COUNT(*) FROM quotations`);
    console.log(`   新库 quotations 表: ${newCount.rows[0].count} 条记录\n`);

    // 6. 打印错误汇总
    if (errors.length > 0) {
      console.log('6. 错误汇总:');
      errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
      if (errors.length > 10) console.log(`   ... 还有 ${errors.length - 10} 条错误`);
    }

    console.log('\n✨ 修复完成！');

  } catch (err) {
    console.error('修复失败:', err);
    throw err;
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

fixMigration().catch(console.error);
