/**
 * 修复 quotations 表 customer_id 和 shipping_type 空值问题
 *
 * 策略：
 * 1. 先尝试通过 customer_name 匹配已有客户
 * 2. 剩余空值使用默认客户填充
 * 3. 填充 shipping_type 默认值
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// 数据库连接配置
const NEW_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'cost_analysis_v2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1998',
};

const OLD_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'cost_analysis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1998',
};

// 默认客户UUID
const DEFAULT_CUSTOMER_UUID = '00000000-0000-0000-0000-000000000001';

interface FixStats {
  step: string;
  affected: number;
  success: boolean;
  error?: string;
}

const stats: FixStats[] = [];

/**
 * 检查默认客户是否存在
 */
async function checkDefaultCustomer(client: Client): Promise<boolean> {
  const result = await client.query(
    `SELECT id, name FROM customers WHERE id = $1`,
    [DEFAULT_CUSTOMER_UUID]
  );
  if (result.rows.length > 0) {
    console.log(`  默认客户存在: ${result.rows[0].name}`);
    return true;
  }
  console.log('  ⚠️ 默认客户不存在，需要创建');
  return false;
}

/**
 * 创建默认客户
 */
async function createDefaultCustomer(client: Client): Promise<void> {
  await client.query(`
    INSERT INTO customers (id, code, name, region, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [DEFAULT_CUSTOMER_UUID, 'UNKNOWN', '未指定客户', 'Unknown']);
  console.log('  已创建默认客户');
}

/**
 * 步骤1: 通过 customer_name 匹配更新 customer_id
 */
async function matchCustomersByName(
  oldClient: Client,
  newClient: Client
): Promise<number> {
  console.log('\n步骤1: 通过客户名称匹配更新 customer_id...');

  // 获取旧库中 quotation_no + customer_name 的映射
  const oldResult = await oldClient.query(`
    SELECT quotation_no, customer_name
    FROM quotations
    WHERE customer_name IS NOT NULL AND customer_name != ''
  `);

  console.log(`  旧库中有 ${oldResult.rows.length} 条报价单记录含客户名称`);

  // 获取新库中的客户列表
  const customersResult = await newClient.query(`
    SELECT id, name FROM customers
  `);
  const customers = customersResult.rows;
  console.log(`  新库中有 ${customers.length} 个客户`);

  // 建立客户名称到ID的映射（不区分大小写）
  const customerNameMap = new Map<string, string>();
  for (const c of customers) {
    customerNameMap.set(c.name.toLowerCase().trim(), c.id);
  }

  let matchedCount = 0;

  // 逐条尝试匹配
  for (const row of oldResult.rows) {
    const customerName = row.customer_name?.toLowerCase().trim();
    if (!customerName) continue;

    const customerId = customerNameMap.get(customerName);
    if (customerId) {
      const updateResult = await newClient.query(`
        UPDATE quotations
        SET customer_id = $1
        WHERE quotation_no = $2 AND customer_id IS NULL
      `, [customerId, row.quotation_no]);

      if (updateResult.rowCount && updateResult.rowCount > 0) {
        matchedCount++;
      }
    }
  }

  console.log(`  成功匹配并更新: ${matchedCount} 条记录`);
  return matchedCount;
}

/**
 * 步骤2: 使用默认客户填充剩余空值
 */
async function fillDefaultCustomer(client: Client): Promise<number> {
  console.log('\n步骤2: 使用默认客户填充剩余空值...');

  const result = await client.query(`
    UPDATE quotations
    SET customer_id = $1
    WHERE customer_id IS NULL
  `, [DEFAULT_CUSTOMER_UUID]);

  const count = result.rowCount || 0;
  console.log(`  已填充默认客户: ${count} 条记录`);
  return count;
}

/**
 * 步骤3: 填充 shipping_type 默认值
 */
async function fillDefaultShippingType(client: Client): Promise<number> {
  console.log('\n步骤3: 填充 shipping_type 默认值...');

  // 先检查有多少条记录的 shipping_type 为 NULL
  const checkResult = await client.query(`
    SELECT COUNT(*) FROM quotations WHERE shipping_type IS NULL
  `);
  const nullCount = parseInt(checkResult.rows[0].count);
  console.log(`  发现 ${nullCount} 条记录 shipping_type 为 NULL`);

  if (nullCount === 0) {
    return 0;
  }

  const result = await client.query(`
    UPDATE quotations
    SET shipping_type = 'fcl20'
    WHERE shipping_type IS NULL
  `);

  const count = result.rowCount || 0;
  console.log(`  已填充 shipping_type: ${count} 条记录`);
  return count;
}

/**
 * 验证修复结果
 */
async function verifyFix(client: Client): Promise<void> {
  console.log('\n验证修复结果...');

  // 检查 customer_id 空值
  const nullCustomerResult = await client.query(`
    SELECT COUNT(*) FROM quotations WHERE customer_id IS NULL
  `);
  const nullCustomerCount = parseInt(nullCustomerResult.rows[0].count);
  console.log(`  customer_id 为空的记录: ${nullCustomerCount}`);

  // 检查 shipping_type 空值（只检查 NULL，枚举类型不能有''）
  const nullShippingResult = await client.query(`
    SELECT COUNT(*) FROM quotations WHERE shipping_type IS NULL
  `);
  const nullShippingCount = parseInt(nullShippingResult.rows[0].count);
  console.log(`  shipping_type 为空的记录: ${nullShippingCount}`);

  // 统计各客户关联的报价单数量
  const customerStats = await client.query(`
    SELECT c.name, COUNT(q.id) as count
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);

  console.log('\n  各客户报价单分布:');
  for (const row of customerStats.rows) {
    console.log(`    ${row.name}: ${row.count} 条`);
  }

  // 统计 shipping_type 分布
  const shippingStats = await client.query(`
    SELECT shipping_type, COUNT(*) as count
    FROM quotations
    GROUP BY shipping_type
    ORDER BY count DESC
  `);

  console.log('\n  shipping_type 分布:');
  for (const row of shippingStats.rows) {
    console.log(`    ${row.shipping_type}: ${row.count} 条`);
  }

  return {
    nullCustomerCount,
    nullShippingCount,
    customerDistribution: customerStats.rows,
    shippingDistribution: shippingStats.rows,
  } as any;
}

/**
 * 主修复函数
 */
async function fixQuotations(): Promise<void> {
  console.log('='.repeat(60));
  console.log('修复 quotations 表数据');
  console.log('='.repeat(60));

  const oldClient = new Client(OLD_DB_CONFIG);
  const newClient = new Client(NEW_DB_CONFIG);

  try {
    // 连接数据库
    console.log('\n连接数据库...');
    await oldClient.connect();
    await newClient.connect();
    console.log('  已连接');

    // 检查当前状态
    const beforeResult = await newClient.query(`
      SELECT
        COUNT(*) as total,
        COUNT(customer_id) as with_customer,
        COUNT(*) - COUNT(customer_id) as without_customer,
        COUNT(shipping_type) as with_shipping,
        COUNT(*) - COUNT(shipping_type) as without_shipping
      FROM quotations
    `);
    const before = beforeResult.rows[0];
    console.log('\n修复前状态:');
    console.log(`  总记录数: ${before.total}`);
    console.log(`  有 customer_id: ${before.with_customer}`);
    console.log(`  无 customer_id: ${before.without_customer}`);
    console.log(`  有 shipping_type: ${before.with_shipping}`);
    console.log(`  无 shipping_type: ${before.without_shipping}`);

    // 检查/创建默认客户
    const hasDefault = await checkDefaultCustomer(newClient);
    if (!hasDefault) {
      await createDefaultCustomer(newClient);
    }

    // 执行修复步骤
    const matchedCount = await matchCustomersByName(oldClient, newClient);
    stats.push({ step: 'match_by_name', affected: matchedCount, success: true });

    const filledCustomerCount = await fillDefaultCustomer(newClient);
    stats.push({ step: 'fill_default_customer', affected: filledCustomerCount, success: true });

    const filledShippingCount = await fillDefaultShippingType(newClient);
    stats.push({ step: 'fill_default_shipping', affected: filledShippingCount, success: true });

    // 验证结果
    await verifyFix(newClient);

    // 检查修复后状态
    const afterResult = await newClient.query(`
      SELECT
        COUNT(*) as total,
        COUNT(customer_id) as with_customer,
        COUNT(*) - COUNT(customer_id) as without_customer,
        COUNT(shipping_type) as with_shipping,
        COUNT(*) - COUNT(shipping_type) as without_shipping
      FROM quotations
    `);
    const after = afterResult.rows[0];
    console.log('\n修复后状态:');
    console.log(`  总记录数: ${after.total}`);
    console.log(`  有 customer_id: ${after.with_customer}`);
    console.log(`  无 customer_id: ${after.without_customer}`);
    console.log(`  有 shipping_type: ${after.with_shipping}`);
    console.log(`  无 shipping_type: ${after.without_shipping}`);

    console.log('\n' + '='.repeat(60));
    console.log('修复完成!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n修复失败:', err);
    throw err;
  } finally {
    await oldClient.end();
    await newClient.end();
    console.log('数据库连接已关闭');
  }
}

// 执行修复
fixQuotations()
  .then(() => {
    console.log('\n✨ 修复成功完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 修复失败:', err);
    process.exit(1);
  });
