/**
 * UUID 转换工具
 * 基于表名和旧整数ID生成确定性UUID
 *
 * 使用 UUID v5 命名空间算法，确保同一表+ID总是生成相同的UUID
 */

import { v5 as uuidv5 } from 'uuid';

// 使用标准DNS命名空间作为基础
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * 将整数ID转换为确定性UUID
 * @param tableName - 表名（小写）
 * @param oldId - 旧整数ID
 * @returns 确定性UUID字符串
 */
export function intToUuid(tableName: string, oldId: number): string {
  const key = `${tableName}:${oldId}`;
  return uuidv5(key, NAMESPACE);
}

/**
 * 批量转换整数ID数组为UUID数组
 * @param tableName - 表名
 * @param oldIds - 旧整数ID数组
 * @returns UUID字符串数组
 */
export function batchIntToUuid(tableName: string, oldIds: number[]): string[] {
  return oldIds.map(id => intToUuid(tableName, id));
}

/**
 * 创建UUID映射表（用于外键转换）
 * @param tableName - 表名
 * @param oldIds - 旧整数ID数组
 * @returns Map<旧ID, 新UUID>
 */
export function createUuidMap(tableName: string, oldIds: number[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const oldId of oldIds) {
    map.set(oldId, intToUuid(tableName, oldId));
  }
  return map;
}

/**
 * 表名常量定义（统一小写）
 */
export const TABLE_NAMES = {
  USERS: 'users',
  REGULATIONS: 'regulations',
  CUSTOMERS: 'customers',
  MATERIALS: 'materials',
  MODELS: 'models',
  BOM_MATERIALS: 'bom_materials',
  PACKAGING_CONFIGS: 'packaging_configs',
  PROCESS_CONFIGS: 'process_configs',
  PACKAGING_MATERIALS: 'packaging_materials',
  QUOTATIONS: 'quotations',
  STANDARD_COSTS: 'standard_costs',
  NOTIFICATIONS: 'notifications',
  SYSTEM_CONFIG: 'system_config',
} as const;

/**
 * 获取表的新UUID（用于外键引用）
 * @param tableName - 被引用的表名
 * @param oldId - 旧整数ID（可能为null）
 * @returns UUID字符串或null
 */
export function getForeignKeyUuid(tableName: string, oldId: number | null): string | null {
  if (oldId === null || oldId === undefined) {
    return null;
  }
  return intToUuid(tableName, oldId);
}

// 测试代码
if (require.main === module) {
  // 验证确定性：同一输入应产生相同输出
  const uuid1 = intToUuid('users', 1);
  const uuid2 = intToUuid('users', 1);
  const uuid3 = intToUuid('users', 2);
  const uuid4 = intToUuid('materials', 1);

  console.log('UUID转换测试:');
  console.log(`  users:1    → ${uuid1}`);
  console.log(`  users:1    → ${uuid2} (应相同)`);
  console.log(`  users:2    → ${uuid3} (应不同)`);
  console.log(`  materials:1 → ${uuid4} (表不同，应不同)`);

  // 验证确定性
  if (uuid1 !== uuid2) {
    console.error('错误：同一输入产生了不同的UUID！');
    process.exit(1);
  }
  if (uuid1 === uuid3) {
    console.error('错误：不同输入产生了相同的UUID！');
    process.exit(1);
  }
  if (uuid1 === uuid4) {
    console.error('错误：不同表产生了相同的UUID！');
    process.exit(1);
  }

  console.log('\n所有测试通过！');
}
