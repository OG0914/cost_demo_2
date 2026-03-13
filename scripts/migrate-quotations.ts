/**
 * 迁移 quotations 数据从旧库到新库
 * 处理字段映射和外键转换
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
  database: 'cost_analysis_new',
  user: 'postgres',
  password: '1998',
};

// 默认客户UUID
const DEFAULT_CUSTOMER_UUID = '00000000-0000-0000-0000-000000000001';

async function migrate() {
  const oldClient = new Client(OLD_DB_CONFIG);
  const newClient = new Client(NEW_DB_CONFIG);

  try {
    await oldClient.connect();
    await newClient.connect();
    console.log('='.repeat(60));
    console.log('迁移 quotations 数据');
    console.log('='.repeat(60));

    // 1. 获取新库参考数据
    console.log('\n1. 加载新库参考数据...');
    const customersResult = await newClient.query('SELECT id, name FROM customers');
    const customerNameMap = new Map<string, string>();
    for (const c of customersResult.rows) {
      customerNameMap.set(c.name.toLowerCase().trim(), c.id);
    }
    console.log(`   ✓ 客户: ${customersResult.rows.length} 个`);

    const modelsResult = await newClient.query('SELECT id FROM models ORDER BY id LIMIT 1');
    const defaultModelId = modelsResult.rows[0]?.id;
    console.log(`   ✓ 默认模型: ${defaultModelId?.substring(0, 8)}...`);

    const regulationsResult = await newClient.query('SELECT id FROM regulations ORDER BY id LIMIT 1');
    const defaultRegulationId = regulationsResult.rows[0]?.id;
    console.log(`   ✓ 默认法规: ${defaultRegulationId?.substring(0, 8)}...`);

    // 获取第一个用户作为 created_by 默认值
    const usersResult = await newClient.query('SELECT id FROM users LIMIT 1');
    const defaultUserId = usersResult.rows[0]?.id;
    console.log(`   ✓ 默认用户: ${defaultUserId?.substring(0, 8)}...`);

    // 获取 model_id 到 packaging_config_id 的映射
    const packagingResult = await newClient.query(
      "SELECT id, model_id FROM packaging_configs WHERE name NOT LIKE '%deleted%'"
    );
    const modelToPackagingMap = new Map<string, string>();
    for (const p of packagingResult.rows) {
      if (p.model_id && !modelToPackagingMap.has(p.model_id)) {
        modelToPackagingMap.set(p.model_id, p.id);
      }
    }
    const defaultPackagingId = packagingResult.rows[0]?.id;
    console.log(`   ✓ 包装配置映射: ${modelToPackagingMap.size} 个模型`);

    // 2. 检查/创建默认客户
    console.log('\n2. 检查默认客户...');
    const defaultCustomerExists = await newClient.query(
      'SELECT id FROM customers WHERE id = $1',
      [DEFAULT_CUSTOMER_UUID]
    );
    if (defaultCustomerExists.rows.length === 0) {
      await newClient.query(`
        INSERT INTO customers (id, code, name, region, created_by, updated_by, created_at, updated_at)
        VALUES ($1, 'UNKNOWN', '未指定客户', 'Unknown', $2, $2, NOW(), NOW())
      `, [DEFAULT_CUSTOMER_UUID, defaultUserId]);
      console.log('   ✓ 创建默认客户');
    } else {
      console.log('   ✓ 默认客户已存在');
    }

    // 3. 读取旧库数据
    console.log('\n3. 读取旧库 quotations 数据...');
    const oldData = await oldClient.query(`
      SELECT * FROM quotations
      WHERE deleted_at IS NULL
      ORDER BY id
    `);
    console.log(`   ✓ 读取 ${oldData.rows.length} 条记录`);

    // 4. 迁移每条记录
    console.log('\n4. 开始迁移记录...');
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of oldData.rows) {
      try {
        // 生成UUID
        const id = intToUuid('quotations', row.id);
        const modelId = getForeignKeyUuid('models', row.model_id) || defaultModelId;
        const regulationId = getForeignKeyUuid('regulations', row.regulation_id) || defaultRegulationId;
        const createdBy = getForeignKeyUuid('users', row.created_by) || defaultUserId;
        const reviewedBy = getForeignKeyUuid('users', row.reviewed_by);

        // 匹配客户
        let customerId = DEFAULT_CUSTOMER_UUID;
        if (row.customer_name) {
          const matchedId = customerNameMap.get(row.customer_name.toLowerCase().trim());
          if (matchedId) {
            customerId = matchedId;
          }
        }

        // 获取 packaging_config_id
        const packagingConfigId = modelToPackagingMap.get(modelId) || defaultPackagingId;

        // 销售类型转换
        const saleType = row.sales_type?.toLowerCase() === 'export' ? 'export' : 'domestic';

        // 运输方式转换
        let shippingType = 'fcl20';
        const rawShipping = row.shipping_method?.toLowerCase().replace(/_/g, '') || '';
        if (rawShipping === 'fcl20' || rawShipping === '20') shippingType = 'fcl20';
        else if (rawShipping === 'fcl40' || rawShipping === '40') shippingType = 'fcl40';
        else if (rawShipping === 'lcl') shippingType = 'lcl';
        else if (rawShipping === 'air') shippingType = 'air';
        else if (rawShipping === 'sea') shippingType = 'fcl20';

        // 状态转换
        const status = row.status?.toLowerCase() || 'draft';

        // 数值字段
        const quantity = row.quantity || 0;
        const materialCost = parseFloat(row.base_cost) || 0;
        const packagingCost = 0;  // 旧库无此字段
        const processCost = 0;    // 旧库无此字段
        const shippingCost = parseFloat(row.freight_total) || 0;
        const adminFee = parseFloat(row.overhead_price) || 0;
        const vat = parseFloat(row.vat_rate) || 0;
        const totalCost = parseFloat(row.final_price) || 0;

        // 插入新库
        await newClient.query(`
          INSERT INTO quotations (
            id, quotation_no, customer_id, regulation_id, model_id, packaging_config_id,
            sale_type, shipping_type, quantity,
            material_cost, packaging_cost, process_cost, shipping_cost, admin_fee, vat, total_cost,
            status, created_by, created_at, updated_at,
            reviewed_by, reviewed_at, review_note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            model_id = EXCLUDED.model_id,
            regulation_id = EXCLUDED.regulation_id,
            packaging_config_id = EXCLUDED.packaging_config_id,
            sale_type = EXCLUDED.sale_type,
            shipping_type = EXCLUDED.shipping_type,
            quantity = EXCLUDED.quantity,
            material_cost = EXCLUDED.material_cost,
            packaging_cost = EXCLUDED.packaging_cost,
            process_cost = EXCLUDED.process_cost,
            shipping_cost = EXCLUDED.shipping_cost,
            admin_fee = EXCLUDED.admin_fee,
            vat = EXCLUDED.vat,
            total_cost = EXCLUDED.total_cost,
            status = EXCLUDED.status,
            updated_at = NOW()
        `, [
          id, row.quotation_no, customerId, regulationId, modelId, packagingConfigId,
          saleType, shippingType, quantity,
          materialCost, packagingCost, processCost, shippingCost, adminFee, vat, totalCost,
          status, createdBy, row.created_at, row.updated_at,
          reviewedBy, row.reviewed_at, row.batch_remark
        ]);

        successCount++;
        process.stdout.write(`   进度: ${successCount}/${oldData.rows.length}\r`);
      } catch (err: any) {
        errorCount++;
        errors.push(`记录 ${row.id}: ${err.message}`);
        console.log(`\n   ✗ 记录 ${row.id} 失败: ${err.message}`);
      }
    }

    console.log(`\n   ✓ 成功: ${successCount}, 失败: ${errorCount}`);

    // 5. 验证结果
    console.log('\n5. 验证迁移结果...');
    const newCount = await newClient.query('SELECT COUNT(*) as count FROM quotations');
    console.log(`   新库 quotations: ${newCount.rows[0].count} 条记录`);

    // 显示各客户分布
    const customerStats = await newClient.query(`
      SELECT c.name, COUNT(q.id) as count
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);
    console.log('\n   客户分布:');
    customerStats.rows.slice(0, 5).forEach((r: any) => {
      console.log(`     ${r.name}: ${r.count} 条`);
    });

    // 6. 打印错误汇总
    if (errors.length > 0) {
      console.log('\n6. 错误汇总 (前5条):');
      errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
      if (errors.length > 5) console.log(`   ... 还有 ${errors.length - 5} 条错误`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ 迁移完成！');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('迁移失败:', err);
    throw err;
  } finally {
    await oldClient.end();
    await newClient.end();
    console.log('数据库连接已关闭');
  }
}

migrate().catch(console.error);
