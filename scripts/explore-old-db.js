/**
 * Phase 1: 摸底旧数据库结构
 * 连接旧数据库 cost_analysis，收集 Schema、数据量、字段信息
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 旧数据库连接配置
const OLD_DB_URL = 'postgresql://postgres:1998@localhost:5432/cost_analysis';

const pool = new Pool({
  connectionString: OLD_DB_URL,
});

async function exploreDatabase() {
  const client = await pool.connect();
  console.log('✅ 已连接到旧数据库 cost_analysis\n');

  try {
    // 1. 获取所有表名
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`📋 发现 ${tables.length} 个表:`, tables.join(', '));

    // 2. 统计各表数据量
    console.log('\n📊 统计各表数据量...');
    const tableStats = [];
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(countResult.rows[0].count);
        tableStats.push({ table, count });
        console.log(`  - ${table}: ${count} 条记录`);
      } catch (err) {
        console.log(`  - ${table}: 无法统计 (${err.message})`);
        tableStats.push({ table, count: -1, error: err.message });
      }
    }

    // 保存表统计到 JSON
    fs.writeFileSync(
      path.join(__dirname, 'table_stats.json'),
      JSON.stringify({
        database: 'cost_analysis',
        generatedAt: new Date().toISOString(),
        tables: tableStats
      }, null, 2)
    );
    console.log('\n✅ 表统计已保存到 table_stats.json');

    // 3. 获取核心表的字段结构
    const coreTables = [
      'users', 'roles', 'materials', 'models', 'model_boms',
      'quotations', 'quotation_items', 'customers', 'regulations', 'packaging_configs'
    ];

    console.log('\n📋 获取核心表字段结构...');
    let fieldMappingMd = `# 旧数据库字段映射文档

> 数据库: cost_analysis
> 生成时间: ${new Date().toISOString()}

## 表列表

| 表名 | 记录数 |
|------|--------|
${tableStats.map(t => `| ${t.table} | ${t.count >= 0 ? t.count : 'N/A'} |`).join('\n')}

## 核心表字段详情

`;

    for (const table of coreTables) {
      if (!tables.includes(table)) {
        console.log(`  ⚠️ 表 ${table} 不存在，跳过`);
        continue;
      }

      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      fieldMappingMd += `### ${table}\n\n`;
      fieldMappingMd += `| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |\n`;
      fieldMappingMd += `|--------|----------|-----------|------|--------|\n`;

      for (const col of columnsResult.rows) {
        const typeStr = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.numeric_precision
            ? `${col.data_type}(${col.numeric_precision},${col.numeric_scale})`
            : col.data_type;

        fieldMappingMd += `| ${col.column_name} | ${typeStr} | ${col.character_maximum_length || col.numeric_precision || '-'} | ${col.is_nullable} | ${col.column_default || '-'} |\n`;
      }
      fieldMappingMd += '\n';
      console.log(`  ✅ ${table}: ${columnsResult.rows.length} 个字段`);
    }

    // 4. 检查外键约束
    console.log('\n🔗 检查外键约束...');
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);

    fieldMappingMd += `## 外键约束\n\n`;
    fieldMappingMd += `| 表名 | 字段 | 引用表 | 引用字段 | 约束名 |\n`;
    fieldMappingMd += `|------|------|--------|----------|--------|\n`;

    for (const fk of fkResult.rows) {
      fieldMappingMd += `| ${fk.table_name} | ${fk.column_name} | ${fk.foreign_table_name} | ${fk.foreign_column_name} | ${fk.constraint_name} |\n`;
    }
    console.log(`  ✅ 发现 ${fkResult.rows.length} 个外键约束`);

    // 5. 检查索引
    console.log('\n📇 检查索引...');
    const indexResult = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    fieldMappingMd += `\n## 索引列表\n\n`;
    fieldMappingMd += `| 表名 | 索引名 | 定义 |\n`;
    fieldMappingMd += `|------|--------|------|\n`;

    for (const idx of indexResult.rows) {
      const def = idx.indexdef.replace(/CREATE /, '').substring(0, 80) + '...';
      fieldMappingMd += `| ${idx.tablename} | ${idx.indexname} | ${def} |\n`;
    }
    console.log(`  ✅ 发现 ${indexResult.rows.length} 个索引`);

    // 6. 检查触发器
    console.log('\n⚡ 检查触发器...');
    const triggerResult = await client.query(`
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    fieldMappingMd += `\n## 触发器\n\n`;
    if (triggerResult.rows.length === 0) {
      fieldMappingMd += `> 未发现触发器\n`;
      console.log('  ℹ️ 未发现触发器');
    } else {
      fieldMappingMd += `| 触发器名 | 表名 | 时机 | 事件 | 动作 |\n`;
      fieldMappingMd += `|----------|------|------|------|------|\n`;
      for (const trig of triggerResult.rows) {
        fieldMappingMd += `| ${trig.trigger_name} | ${trig.event_object_table} | ${trig.action_timing} | ${trig.event_manipulation} | ${trig.action_statement.substring(0, 50)}... |\n`;
      }
      console.log(`  ✅ 发现 ${triggerResult.rows.length} 个触发器`);
    }

    // 7. 检查存储过程/函数
    console.log('\n🔧 检查存储过程和函数...');
    const functionResult = await client.query(`
      SELECT
        routine_name,
        routine_type,
        data_type AS return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_type, routine_name
    `);

    fieldMappingMd += `\n## 存储过程/函数\n\n`;
    if (functionResult.rows.length === 0) {
      fieldMappingMd += `> 未发现存储过程或函数\n`;
      console.log('  ℹ️ 未发现存储过程或函数');
    } else {
      fieldMappingMd += `| 名称 | 类型 | 返回类型 |\n`;
      fieldMappingMd += `|------|------|----------|\n`;
      for (const func of functionResult.rows) {
        fieldMappingMd += `| ${func.routine_name} | ${func.routine_type} | ${func.return_type} |\n`;
      }
      console.log(`  ✅ 发现 ${functionResult.rows.length} 个存储过程/函数`);
    }

    // 保存字段映射文档
    fs.writeFileSync(path.join(__dirname, 'field_mapping.md'), fieldMappingMd);
    console.log('\n✅ 字段映射文档已保存到 field_mapping.md');

    // 8. 生成 Schema SQL (模拟 pg_dump --schema-only)
    console.log('\n📝 生成 Schema SQL...');

    // 获取建表语句
    let schemaSql = `-- 旧数据库 Schema 导出
-- 数据库: cost_analysis
-- 生成时间: ${new Date().toISOString()}

`;

    // 获取所有表的列信息并生成 CREATE TABLE 语句
    for (const table of tables) {
      const colsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      schemaSql += `CREATE TABLE "${table}" (\n`;
      const colDefs = [];
      for (const col of colsResult.rows) {
        let typeStr = col.data_type;
        if (col.character_maximum_length) {
          typeStr += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision && col.data_type === 'numeric') {
          typeStr += `(${col.numeric_precision},${col.numeric_scale || 0})`;
        }

        let colDef = `  "${col.column_name}" ${typeStr}`;
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`;
        }
        colDefs.push(colDef);
      }

      // 获取主键
      const pkResult = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
        ORDER BY kcu.ordinal_position
      `, [table]);

      if (pkResult.rows.length > 0) {
        const pkCols = pkResult.rows.map(r => `"${r.column_name}"`).join(', ');
        colDefs.push(`  CONSTRAINT "${table}_pkey" PRIMARY KEY (${pkCols})`);
      }

      schemaSql += colDefs.join(',\n');
      schemaSql += '\n);\n\n';
    }

    // 添加外键约束
    schemaSql += `-- 外键约束\n`;
    for (const fk of fkResult.rows) {
      schemaSql += `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" `;
      schemaSql += `FOREIGN KEY ("${fk.column_name}") `;
      schemaSql += `REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}");\n`;
    }

    fs.writeFileSync(path.join(__dirname, 'old_schema.sql'), schemaSql);
    console.log('✅ Schema SQL 已保存到 old_schema.sql');

    console.log('\n========================================');
    console.log('Phase 1 完成！输出文件：');
    console.log('  - scripts/old_schema.sql');
    console.log('  - scripts/table_stats.json');
    console.log('  - scripts/field_mapping.md');
    console.log('========================================');

  } finally {
    client.release();
    await pool.end();
  }
}

exploreDatabase().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
