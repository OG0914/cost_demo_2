/**
 * 分析旧数据库 quotations 表数据质量
 * 用于诊断迁移失败原因
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// 旧数据库连接配置
const OLD_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'cost_analysis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1998',
};

async function analyzeQuotations() {
  const client = new Client(OLD_DB_CONFIG);

  try {
    await client.connect();
    console.log('已连接到旧数据库: cost_analysis\n');

    // 1. 获取表结构信息
    console.log('='.repeat(80));
    console.log('1. QUOTATIONS 表字段结构');
    console.log('='.repeat(80));

    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'quotations'
      ORDER BY ordinal_position
    `);

    console.log('\n字段列表:');
    console.log('-'.repeat(80));
    for (const col of columnsResult.rows) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable} ${defaultVal}`);
    }

    // 2. 统计总记录数
    const countResult = await client.query('SELECT COUNT(*) FROM quotations');
    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`\n总记录数: ${totalCount}`);

    // 3. 各字段空值统计
    console.log('\n' + '='.repeat(80));
    console.log('2. 字段空值统计');
    console.log('='.repeat(80));

    const fieldsToCheck = [
      'customer_id',
      'customer_name',
      'customer_region',
      'shipping_method',
      'shipping_type',
      'sales_type',
      'model_id',
      'regulation_id',
      'packaging_config_id',
      'created_by',
      'reviewed_by',
      'quotation_no',
      'quantity',
      'final_price',
      'freight_total',
      'status'
    ];

    console.log('\n字段空值情况:');
    console.log('-'.repeat(80));
    console.log(`${'字段名'.padEnd(30)} ${'空值数量'.padEnd(12)} ${'空值比例'.padEnd(12)} ${'非空数量'}`);
    console.log('-'.repeat(80));

    for (const field of fieldsToCheck) {
      // 检查字段是否存在
      const fieldExists = columnsResult.rows.some((col: any) => col.column_name === field);
      if (!fieldExists) {
        console.log(`${field.padEnd(30)} 字段不存在`);
        continue;
      }

      const nullResult = await client.query(`
        SELECT COUNT(*) as null_count
        FROM quotations
        WHERE "${field}" IS NULL
      `);
      const nullCount = parseInt(nullResult.rows[0].null_count);
      const nullPercent = ((nullCount / totalCount) * 100).toFixed(2);
      const notNullCount = totalCount - nullCount;

      const indicator = nullCount === totalCount ? '❌ 全空' :
                        nullCount > totalCount * 0.5 ? '⚠️  过半空' :
                        nullCount > 0 ? '⚡ 部分空' : '✅ 无空值';

      console.log(`${field.padEnd(30)} ${nullCount.toString().padEnd(12)} ${(nullPercent + '%').padEnd(12)} ${notNullCount} ${indicator}`);
    }

    // 4. 查看样例数据（包含空值的记录）
    console.log('\n' + '='.repeat(80));
    console.log('3. 包含空值的样例数据（前5条）');
    console.log('='.repeat(80));

    const sampleResult = await client.query(`
      SELECT
        id,
        quotation_no,
        customer_id,
        customer_name,
        customer_region,
        shipping_method,
        sales_type,
        model_id,
        regulation_id,
        packaging_config_id,
        quantity,
        final_price,
        freight_total,
        status,
        created_by,
        reviewed_by
      FROM quotations
      WHERE customer_id IS NULL
         OR shipping_method IS NULL
      LIMIT 5
    `);

    if (sampleResult.rows.length === 0) {
      console.log('\n没有找到包含空值的记录');
    } else {
      for (let i = 0; i < sampleResult.rows.length; i++) {
        const row = sampleResult.rows[i];
        console.log(`\n--- 记录 ${i + 1} (ID: ${row.id}) ---`);
        console.log(`  quotation_no:     ${row.quotation_no || 'NULL'}`);
        console.log(`  customer_id:      ${row.customer_id || 'NULL'}`);
        console.log(`  customer_name:    ${row.customer_name || 'NULL'}`);
        console.log(`  customer_region:  ${row.customer_region || 'NULL'}`);
        console.log(`  shipping_method:  ${row.shipping_method || 'NULL'}`);
        console.log(`  shipping_type:    ${row.shipping_type || 'NULL'}`);
        console.log(`  sales_type:       ${row.sales_type || 'NULL'}`);
        console.log(`  model_id:         ${row.model_id || 'NULL'}`);
        console.log(`  regulation_id:    ${row.regulation_id || 'NULL'}`);
        console.log(`  packaging_config_id: ${row.packaging_config_id || 'NULL'}`);
        console.log(`  quantity:         ${row.quantity || 'NULL'}`);
        console.log(`  final_price:      ${row.final_price || 'NULL'}`);
        console.log(`  freight_total:    ${row.freight_total || 'NULL'}`);
        console.log(`  status:           ${row.status || 'NULL'}`);
        console.log(`  created_by:       ${row.created_by || 'NULL'}`);
        console.log(`  reviewed_by:      ${row.reviewed_by || 'NULL'}`);
      }
    }

    // 5. 分析 customer_name 与 customer_id 的关系
    console.log('\n' + '='.repeat(80));
    console.log('4. CUSTOMER_NAME 与 CUSTOMER_ID 关系分析');
    console.log('='.repeat(80));

    const customerRelationResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(customer_id) as has_customer_id,
        COUNT(customer_name) as has_customer_name,
        COUNT(*) - COUNT(customer_id) as missing_customer_id,
        COUNT(*) - COUNT(customer_name) as missing_customer_name,
        COUNT(CASE WHEN customer_id IS NULL AND customer_name IS NOT NULL THEN 1 END) as can_potentially_fix
      FROM quotations
    `);

    const rel = customerRelationResult.rows[0];
    console.log(`\n总记录数:              ${rel.total}`);
    console.log(`有 customer_id:        ${rel.has_customer_id}`);
    console.log(`有 customer_name:      ${rel.has_customer_name}`);
    console.log(`缺失 customer_id:      ${rel.missing_customer_id}`);
    console.log(`缺失 customer_name:    ${rel.missing_customer_name}`);
    console.log(`\n可通过 customer_name 修复的: ${rel.can_potentially_fix} 条`);

    // 6. 查看不同 customer_name 的分布（用于匹配）
    console.log('\n' + '='.repeat(80));
    console.log('5. CUSTOMER_NAME 分布（可用于关联客户）');
    console.log('='.repeat(80));

    const customerNameResult = await client.query(`
      SELECT
        customer_name,
        COUNT(*) as count,
        COUNT(customer_id) as with_id,
        COUNT(*) - COUNT(customer_id) as without_id
      FROM quotations
      WHERE customer_name IS NOT NULL
      GROUP BY customer_name
      ORDER BY count DESC
      LIMIT 10
    `);

    console.log(`\n${'customer_name'.padEnd(30)} ${'总数'.padEnd(8)} ${'有ID'.padEnd(8)} ${'无ID'}`);
    console.log('-'.repeat(80));
    for (const row of customerNameResult.rows) {
      console.log(`${(row.customer_name || '').padEnd(30)} ${row.count.toString().padEnd(8)} ${row.with_id.toString().padEnd(8)} ${row.without_id}`);
    }

    // 7. shipping_method 和 shipping_type 的分布
    console.log('\n' + '='.repeat(80));
    console.log('6. SHIPPING_METHOD / SHIPPING_TYPE 分布');
    console.log('='.repeat(80));

    const shippingMethodResult = await client.query(`
      SELECT shipping_method, COUNT(*) as count
      FROM quotations
      GROUP BY shipping_method
      ORDER BY count DESC
    `);

    console.log('\nshipping_method 分布:');
    for (const row of shippingMethodResult.rows) {
      const val = row.shipping_method || '(NULL)';
      console.log(`  ${val.padEnd(20)} ${row.count}`);
    }

    // shipping_type 字段在旧库不存在，跳过
    console.log('\nshipping_type: 旧库不存在此字段（新库字段，由 shipping_method 映射）');

    // 8. 生成修复建议
    console.log('\n' + '='.repeat(80));
    console.log('7. 修复建议');
    console.log('='.repeat(80));

    const missingCustomerIdCount = parseInt(rel.missing_customer_id);
    const missingShippingMethodCount = await client.query(`
      SELECT COUNT(*) FROM quotations WHERE shipping_method IS NULL
    `).then(r => parseInt(r.rows[0].count));

    console.log(`
基于分析结果，推荐以下修复方案:

A. 补充 CUSTOMER_ID (推荐)
   - ${rel.can_potentially_fix} 条记录可以通过 customer_name 关联到 customers 表
   - 需要查询 customers 表，通过 name 匹配获取 id
   - 对于无法匹配的记录，使用默认客户 ID

B. 允许 NULL 值
   - 修改新库 schema，允许 customer_id 为 NULL
   - 但会影响外键约束和数据完整性

C. 使用默认客户
   - 为所有缺失 customer_id 的记录使用默认客户
   - 已在迁移脚本中实现 (DEFAULT_CUSTOMER_UUID)

D. SHIPPING 字段处理
   - shipping_method 空值: ${missingShippingMethodCount} 条
   - shipping_type 是新库字段，由 shipping_method 映射
   - 已在 ENUM_MAPPINGS 中配置空值映射到 'fcl20'
`);

  } catch (err) {
    console.error('分析失败:', err);
    throw err;
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

// 运行分析
analyzeQuotations()
  .then(() => {
    console.log('\n✅ 分析完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 分析失败:', err);
    process.exit(1);
  });
