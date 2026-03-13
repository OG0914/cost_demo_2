/**
 * 数据库迁移主脚本
 * 从旧架构 (cost_analysis) 迁移到新架构 (cost_analysis_v2)
 *
 * 特性：
 * - 使用确定性UUID转换保持外键关系
 * - 按依赖顺序分批迁移
 * - 完整日志和错误处理
 * - 支持事务回滚
 */

import { Client } from 'pg';
import {
  intToUuid,
  getForeignKeyUuid,
  TABLE_NAMES,
} from './uuid-converter.js';
import {
  FIELD_MAPPINGS,
  FOREIGN_KEYS,
  MIGRATION_ORDER,
  ENUM_MAPPINGS,
  SPECIAL_CONVERTERS,
  DEFAULT_VALUES,
  COMPUTED_FIELDS,
  getOldTableName,
  type MigrationOptions,
  DEFAULT_MIGRATION_OPTIONS,
} from './migration-config.js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const OLD_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'cost_analysis',  // 旧数据库
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1998',
};

const NEW_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'cost_analysis_new',  // 新数据库
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1998',
};

// 统计信息
interface MigrationStats {
  table: string;
  oldCount: number;
  newCount: number;
  success: boolean;
  error?: string;
  duration: number;
}

const stats: MigrationStats[] = [];

/**
 * 创建数据库连接
 */
function createClient(config: typeof OLD_DB_CONFIG): Client {
  return new Client(config);
}

/**
 * 获取旧表数据量
 */
async function getTableCount(client: Client, tableName: string): Promise<number> {
  const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
  return parseInt(result.rows[0].count);
}

/**
 * 转换枚举值
 */
function convertEnum(field: string, value: string): string {
  const mapping = ENUM_MAPPINGS[field];
  if (mapping && value in mapping) {
    return mapping[value];
  }
  return value;
}

/**
 * 获取表的外键映射
 */
function getForeignKeyMapping(tableName: string, field: string): string | null {
  const fks = FOREIGN_KEYS[tableName];
  if (!fks) return null;
  const fk = fks.find(f => f.field === field);
  return fk ? fk.refTable : null;
}

/**
 * 转换字段值
 */
function convertValue(
  tableName: string,
  field: string,
  value: any,
  row: any
): any {
  if (value === null || value === undefined) {
    return null;
  }

  // 处理ID字段（主键或外键）
  const refTable = getForeignKeyMapping(tableName, field);
  if (refTable) {
    // 外键：转换为引用表的UUID
    return getForeignKeyUuid(refTable, value);
  }

  // 处理自引用主键
  if (field === 'id') {
    return intToUuid(tableName, value);
  }

  // 特殊字段转换
  if (field === 'calculation_type') {
    return SPECIAL_CONVERTERS.calculation_type(value);
  }

  if (field === 'currency') {
    return SPECIAL_CONVERTERS.currency(value);
  }

  // 处理Decimal字段
  if (field.includes('cost') || field.includes('price') || field === 'vat' || field === 'admin_fee') {
    const precision = field.includes('cost') && tableName === 'standard_costs' ? 4 : 2;
    return SPECIAL_CONVERTERS.decimal(value, precision);
  }

  // 处理数组字段
  if (field === 'affected_standard_costs') {
    return SPECIAL_CONVERTERS.array(value);
  }

  // 处理布尔值转枚举（status 字段）
  if (field === 'status') {
    if (tableName === 'users' || tableName === 'regulations') {
      // 旧库是布尔值 is_active，新库是枚举
      if (typeof value === 'boolean') {
        return value ? 'active' : 'inactive';
      }
      if (value === 'true' || value === 't') return 'active';
      if (value === 'false' || value === 'f') return 'inactive';
      return value;
    }
    if (tableName === 'quotations') {
      return convertEnum('quotation_status', String(value));
    }
  }

  // 枚举值转换
  if (field === 'role') {
    return convertEnum('role', String(value));
  }

  if (field === 'sale_type') {
    return convertEnum('sale_type', String(value));
  }

  if (field === 'shipping_type') {
    return convertEnum('shipping_type', String(value));
  }

  if (field === 'unit' && tableName === 'process_configs') {
    return convertEnum('process_unit', String(value));
  }

  if (field === 'type' && tableName === 'notifications') {
    return convertEnum('notification_type', String(value));
  }

  return value;
}

/**
 * 构建INSERT语句
 * 支持计算字段和默认值
 */
function buildInsertSql(tableName: string, row: any, defaultUserId: string | null): { sql: string; values: any[] } {
  const fieldMapping = FIELD_MAPPINGS[tableName];
  if (!fieldMapping) {
    throw new Error(`未找到表 ${tableName} 的字段映射`);
  }

  const fields: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  // 获取计算字段配置
  const computedFields = COMPUTED_FIELDS[tableName] || {};
  // 获取默认值配置
  const defaultValues = DEFAULT_VALUES[tableName] || {};

  for (const [oldField, newField] of Object.entries(fieldMapping)) {
    // 跳过空映射
    if (!newField) continue;

    let value: any;

    // 检查是否是计算字段
    if (newField in computedFields) {
      value = computedFields[newField](row);
    } else if (oldField in row) {
      value = convertValue(tableName, newField, row[oldField], row);
    } else {
      // 字段在旧库不存在，使用默认值
      const defaultValue = defaultValues[newField];
      value = typeof defaultValue === 'function' ? defaultValue() : (defaultValue ?? null);
    }

    // 特殊处理：created_by/updated_by 等字段使用默认用户ID
    if ((newField === 'created_by' || newField === 'updated_by' || newField === 'set_by') && !value && defaultUserId) {
      value = defaultUserId;
    }

    // 特殊处理：quotations 表的 customer_id 为空时使用默认客户
    if (tableName === 'quotations' && newField === 'customer_id' && !value) {
      value = DEFAULT_CUSTOMER_UUID;
    }

    // 处理 system_config 表的特殊逻辑
    if (tableName === 'system_config') {
      if (newField === 'value') {
        value = SPECIAL_CONVERTERS.systemConfigValue(row.config_value);
      }
      if (newField === 'updated_at') {
        value = row.updated_at || new Date().toISOString();
      }
      if (newField === 'updated_by') {
        value = defaultUserId;
      }
    }

    // 处理 regulations 表的 name 字段（如果 description 为空，使用原 name）
    if (tableName === 'regulations' && newField === 'name') {
      const oldDescription = row.description;
      const oldName = row.name;
      value = oldDescription || oldName || `REG-${row.id}`;
    }

    fields.push(`"${newField}"`);
    values.push(value);
    placeholders.push(`$${paramIndex++}`);
  }

  const sql = `INSERT INTO "${tableName}" (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, values };
}

/**
 * 迁移单个表
 */
/**
 * 默认客户UUID（用于关联没有 customer_id 的 quotations）
 */
const DEFAULT_CUSTOMER_UUID = '00000000-0000-0000-0000-000000000001';

/**
 * 创建默认客户（用于关联没有 customer_id 的记录）
 */
async function createDefaultCustomer(newClient: Client, defaultUserId: string | null): Promise<void> {
  try {
    // 检查默认客户是否已存在
    const checkResult = await newClient.query(
      `SELECT id FROM customers WHERE id = $1`,
      [DEFAULT_CUSTOMER_UUID]
    );
    if (checkResult.rows.length > 0) {
      return;
    }

    // 创建默认客户
    await newClient.query(`
      INSERT INTO customers (id, code, name, region, created_by, updated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      DEFAULT_CUSTOMER_UUID,
      'UNKNOWN',
      '未指定客户',
      'Unknown',
      defaultUserId,
      defaultUserId
    ]);
    console.log('  已创建默认客户');
  } catch (err) {
    console.log('  警告: 创建默认客户失败', err);
  }
}

/**
 * 获取默认用户ID（用于填充 created_by/updated_by 等字段）
 */
async function getDefaultUserId(oldClient: Client, newClient: Client): Promise<string | null> {
  try {
    // 首先尝试找 admin 用户
    const oldResult = await oldClient.query(
      `SELECT id FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1`
    );
    if (oldResult.rows.length > 0) {
      return intToUuid('users', oldResult.rows[0].id);
    }
    // 如果没有 admin，找第一个用户
    const firstUser = await oldClient.query(`SELECT id FROM users ORDER BY id LIMIT 1`);
    if (firstUser.rows.length > 0) {
      return intToUuid('users', firstUser.rows[0].id);
    }
  } catch (err) {
    console.log('  警告: 无法获取默认用户ID');
  }
  return null;
}

async function migrateTable(
  oldClient: Client,
  newClient: Client,
  tableName: string,
  options: MigrationOptions,
  defaultUserId: string | null
): Promise<MigrationStats> {
  const startTime = Date.now();
  const stat: MigrationStats = {
    table: tableName,
    oldCount: 0,
    newCount: 0,
    success: false,
    duration: 0,
  };

  // 获取旧表名（处理表名不同的情况）
  const oldTableName = getOldTableName(tableName);

  try {
    console.log(`\n开始迁移表: ${tableName}${oldTableName !== tableName ? ` (旧表: ${oldTableName})` : ''}`);

    // 获取旧表数据量
    stat.oldCount = await getTableCount(oldClient, oldTableName);
    console.log(`  旧表记录数: ${stat.oldCount}`);

    if (stat.oldCount === 0) {
      console.log(`  跳过空表: ${tableName}`);
      stat.success = true;
      stat.duration = Date.now() - startTime;
      return stat;
    }

    // 分批读取数据
    let offset = 0;
    let migratedCount = 0;
    let errorCount = 0;

    try {
      while (offset < stat.oldCount) {
        const result = await oldClient.query(
          `SELECT * FROM "${oldTableName}" ORDER BY id LIMIT $1 OFFSET $2`,
          [options.batchSize, offset]
        );

        if (result.rows.length === 0) break;

        // 插入新表
        if (!options.dryRun) {
          for (const row of result.rows) {
            // 每条记录使用独立事务
            await newClient.query('BEGIN');
            try {
              const { sql, values } = buildInsertSql(tableName, row, defaultUserId);
              await newClient.query(sql, values);
              await newClient.query('COMMIT');
              migratedCount++;
            } catch (err: any) {
              await newClient.query('ROLLBACK');
              errorCount++;
              // 处理唯一约束冲突（重复邮箱等）
              if (err.code === '23505') { // unique_violation
                console.log(`    跳过重复记录 ${row.id}: ${err.detail || '唯一约束冲突'}`);
                continue;
              }
              if (options.skipOnError) {
                console.error(`    跳过记录 ${row.id}: ${err.message}`);
              } else {
                throw err;
              }
            }
          }
        } else {
          migratedCount += result.rows.length;
        }

        offset += result.rows.length;
        process.stdout.write(`  已迁移: ${migratedCount}/${stat.oldCount}${errorCount > 0 ? ` (跳过 ${errorCount})` : ''}\r`);
      }

      // 验证新表数据量
      stat.newCount = await getTableCount(newClient, tableName);
      stat.success = migratedCount > 0 || stat.oldCount === 0; // 只要有数据迁移成功就算成功

      console.log(`  完成: ${migratedCount} 条记录, 新表: ${stat.newCount} 条${errorCount > 0 ? `, 跳过: ${errorCount}` : ''}`);

    } catch (err) {
      stat.error = err instanceof Error ? err.message : String(err);
      console.error(`  错误: ${stat.error}`);
      if (!options.skipOnError) {
        throw err;
      }
    }

  } catch (err) {
    stat.error = err instanceof Error ? err.message : String(err);
    console.error(`  错误: ${stat.error}`);
    if (!options.skipOnError) {
      throw err;
    }
  }

  stat.duration = Date.now() - startTime;
  return stat;
}

/**
 * 清空新数据库（用于重新迁移）
 */
async function clearNewDatabase(client: Client): Promise<void> {
  console.log('\n清空新数据库...');

  // 按依赖顺序反向清空（先清空有外键依赖的表）
  const tables = [...MIGRATION_ORDER].reverse();

  for (const table of tables) {
    try {
      await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`  已清空: ${table}`);
    } catch (err) {
      // 表可能不存在，忽略错误
      console.log(`  跳过: ${table}`);
    }
  }
}

/**
 * 打印迁移报告
 */
function printReport(): void {
  console.log('\n' + '='.repeat(60));
  console.log('迁移报告');
  console.log('='.repeat(60));

  let totalOld = 0;
  let totalNew = 0;
  let successCount = 0;

  for (const stat of stats) {
    const status = stat.success ? '✅' : '❌';
    console.log(`${status} ${stat.table.padEnd(25)} ${stat.oldCount.toString().padStart(5)} → ${stat.newCount.toString().padStart(5)} (${stat.duration}ms)`);
    if (stat.error) {
      console.log(`   错误: ${stat.error}`);
    }
    totalOld += stat.oldCount;
    totalNew += stat.newCount;
    if (stat.success) successCount++;
  }

  console.log('-'.repeat(60));
  console.log(`总计: ${stats.length} 个表, 成功: ${successCount}, 失败: ${stats.length - successCount}`);
  console.log(`记录: ${totalOld} → ${totalNew}`);
  console.log('='.repeat(60));
}

/**
 * 主迁移函数
 */
async function migrate(options: MigrationOptions = DEFAULT_MIGRATION_OPTIONS): Promise<void> {
  console.log('开始数据库迁移...');
  console.log(`源数据库: ${OLD_DB_CONFIG.database}`);
  console.log(`目标数据库: ${NEW_DB_CONFIG.database}`);
  console.log(`模式: ${options.dryRun ? '模拟运行' : '实际迁移'}`);

  const oldClient = createClient(OLD_DB_CONFIG);
  const newClient = createClient(NEW_DB_CONFIG);

  try {
    // 连接数据库
    console.log('\n连接数据库...');
    await oldClient.connect();
    await newClient.connect();
    console.log('  已连接');

    // 清空新数据库（可选）
    if (!options.dryRun) {
      await clearNewDatabase(newClient);
    }

    // 获取默认用户ID（用于填充 created_by/updated_by 等字段）
    const defaultUserId = await getDefaultUserId(oldClient, newClient);
    console.log(`  默认用户ID: ${defaultUserId || '未找到'}`);

    // 创建默认客户
    await createDefaultCustomer(newClient, defaultUserId);

    // 按顺序迁移表（每表独立事务）
    for (const tableName of MIGRATION_ORDER) {
      const stat = await migrateTable(oldClient, newClient, tableName, options, defaultUserId);
      stats.push(stat);

      if (!stat.success && !options.skipOnError) {
        throw new Error(`表 ${tableName} 迁移失败`);
      }
    }

    // 打印报告
    printReport();

    // 保存报告到文件
    const reportPath = 'scripts/migration_report.json';
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      options,
      stats,
      summary: {
        totalTables: stats.length,
        successTables: stats.filter(s => s.success).length,
        totalOld: stats.reduce((sum, s) => sum + s.oldCount, 0),
        totalNew: stats.reduce((sum, s) => sum + s.newCount, 0),
      }
    }, null, 2));
    console.log(`\n报告已保存: ${reportPath}`);

  } catch (err) {
    // 回滚事务
    if (options.enableTransaction && !options.dryRun) {
      await newClient.query('ROLLBACK');
      console.log('\n事务已回滚');
    }

    console.error('\n迁移失败:', err);
    throw err;

  } finally {
    await oldClient.end();
    await newClient.end();
    console.log('数据库连接已关闭');
  }
}

// 命令行参数解析
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = { ...DEFAULT_MIGRATION_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-transaction':
        options.enableTransaction = false;
        break;
      case '--no-skip-error':
        options.skipOnError = false;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--log-level':
        options.logLevel = args[++i] as any;
        break;
    }
  }

  return options;
}

// 主入口
if (require.main === module) {
  const options = parseArgs();

  migrate(options)
    .then(() => {
      console.log('\n✨ 迁移完成！');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 迁移失败:', err);
      process.exit(1);
    });
}

export { migrate };
