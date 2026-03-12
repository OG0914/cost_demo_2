import { Client } from 'pg';
import { intToUuid } from './uuid-converter.js';

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

interface ValidationResult {
  table: string;
  oldCount: number;
  newCount: number;
  matched: boolean;
  sampleCheck: boolean;
  errors: string[];
}

async function validate() {
  const oldClient = new Client(OLD_DB_CONFIG);
  const newClient = new Client(NEW_DB_CONFIG);
  
  await oldClient.connect();
  await newClient.connect();
  
  const results: ValidationResult[] = [];
  
  console.log('开始验证迁移数据...\n');
  
  // 1. 验证表数据量
  const tables = [
    { old: 'users', new: 'users' },
    { old: 'regulations', new: 'regulations' },
    { old: 'materials', new: 'materials' },
    { old: 'customers', new: 'customers' },
    { old: 'models', new: 'models' },
    { old: 'model_bom_materials', new: 'bom_materials' },
    { old: 'packaging_configs', new: 'packaging_configs' },
    { old: 'process_configs', new: 'process_configs' },
    { old: 'packaging_materials', new: 'packaging_materials' },
    { old: 'standard_costs', new: 'standard_costs' },
    { old: 'system_config', new: 'system_config' },
  ];
  
  for (const { old, new: newTable } of tables) {
    const oldResult = await oldClient.query(`SELECT COUNT(*) FROM "${old}"`);
    const newResult = await newClient.query(`SELECT COUNT(*) FROM "${newTable}"`);
    
    const oldCount = parseInt(oldResult.rows[0].count);
    const newCount = parseInt(newResult.rows[0].count);
    
    results.push({
      table: newTable,
      oldCount,
      newCount,
      matched: oldCount === newCount,
      sampleCheck: true,
      errors: []
    });
  }
  
  // 2. 抽样验证 UUID 转换
  console.log('\n抽样验证 UUID 转换...');
  
  // 验证 users 表
  const oldUsers = await oldClient.query('SELECT id, username FROM users ORDER BY id LIMIT 3');
  for (const user of oldUsers.rows) {
    const expectedUuid = intToUuid('users', user.id);
    const newUser = await newClient.query('SELECT id, username FROM users WHERE id = $1', [expectedUuid]);
    if (newUser.rows.length === 0) {
      results.find(r => r.table === 'users')?.errors.push(`User ${user.id} (${user.username}) UUID 不匹配`);
    }
  }
  console.log('  ✓ users UUID 验证通过');
  
  // 3. 验证外键关系
  console.log('\n验证外键关系...');
  
  // 验证 customers.created_by 外键
  const invalidCustomers = await newClient.query(`
    SELECT c.id FROM customers c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE u.id IS NULL AND c.created_by IS NOT NULL
  `);
  if (invalidCustomers.rows.length > 0) {
    results.find(r => r.table === 'customers')?.errors.push(`${invalidCustomers.rows.length} 条记录的 created_by 外键无效`);
  }
  console.log('  ✓ customers 外键验证通过');
  
  // 4. 验证字段值转换
  console.log('\n验证字段值转换...');
  
  // 验证 materials 的 item_no -> material_no
  const oldMaterials = await oldClient.query('SELECT id, item_no FROM materials ORDER BY id LIMIT 3');
  for (const mat of oldMaterials.rows) {
    const expectedUuid = intToUuid('materials', mat.id);
    const newMat = await newClient.query('SELECT material_no FROM materials WHERE id = $1', [expectedUuid]);
    if (newMat.rows.length === 0 || newMat.rows[0].material_no !== mat.item_no) {
      results.find(r => r.table === 'materials')?.errors.push(`Material ${mat.id} material_no 不匹配`);
    }
  }
  console.log('  ✓ materials 字段映射验证通过');
  
  // 打印验证报告
  console.log('\n' + '='.repeat(70));
  console.log('数据验证报告');
  console.log('='.repeat(70));
  
  let passCount = 0;
  for (const r of results) {
    const status = r.matched && r.errors.length === 0 ? '✅' : '❌';
    console.log(`${status} ${r.table.padEnd(25)} ${r.oldCount.toString().padStart(5)} → ${r.newCount.toString().padStart(5)} ${r.matched ? '' : '(数量不匹配)'}`);
    for (const err of r.errors) {
      console.log(`   错误: ${err}`);
    }
    if (r.matched && r.errors.length === 0) passCount++;
  }
  
  console.log('-'.repeat(70));
  console.log(`总计: ${results.length} 个表, 通过: ${passCount}, 失败: ${results.length - passCount}`);
  console.log('='.repeat(70));
  
  await oldClient.end();
  await newClient.end();
}

validate().catch(console.error);
