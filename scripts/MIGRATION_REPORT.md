# 数据库迁移报告

**迁移时间**: 2026-03-12
**源数据库**: cost_analysis
**目标数据库**: cost_analysis_v2

---

## 执行摘要

| 指标 | 数值 |
|------|------|
| 总表数 | 13 |
| 完全成功 | 2 |
| 部分成功 | 1 |
| 失败 | 10 |
| 总记录数 | 731 |
| 成功迁移 | 52 |

---

## 详细结果

### ✅ 成功迁移的表

| 表名 | 旧库记录 | 新库记录 | 状态 |
|------|----------|----------|------|
| materials | 50 | 50 | ✅ 完整迁移 |

**说明**: materials 表字段映射正确，所有 50 条记录成功迁移。

### ⚠️ 部分成功的表

| 表名 | 旧库记录 | 新库记录 | 状态 |
|------|----------|----------|------|
| users | 8 | 2 | ⚠️ 部分迁移 |

**问题**:
- 旧库存在重复邮箱（golden_0914@outlook.com 重复 3 次，lucas_huang@makrite.com.tw 重复 3 次）
- 1 条记录 email 为空
- 新库 email 有唯一约束

**解决方案**: 需要清理旧库重复数据或修改新库约束

### ❌ 失败的表

| 表名 | 旧库记录 | 失败原因 |
|------|----------|----------|
| regulations | 3 | 字段名不匹配 |
| customers | 16 | 字段名不匹配 + 外键约束 |
| models | 23 | 字段名不匹配 |
| bom_materials | 90 | 字段名不匹配 |
| packaging_configs | 63 | 字段名不匹配 |
| process_configs | 322 | 字段名不匹配 |
| packaging_materials | 92 | 字段名不匹配 |
| quotations | 29 | 外键依赖失败 |
| standard_costs | 1 | 字段名不匹配 |
| system_config | 34 | 字段名不匹配 |

---

## 关键字段映射问题

### 1. users 表
旧库字段：id, username, password, real_name, email, role_code, status, avatar, last_login_at
新库字段：id, username, password, name, email, role, status

**问题**:
- 旧库 email 有重复值，新库 email 有唯一约束
- 部分记录 email 为空

### 2. regulations 表
旧库字段：id, name, description, is_active, created_at, updated_at
新库字段：id, code, name, description, status, created_at, updated_at

**映射方案**:
- name → code
- description → name
- is_active → status (布尔值转枚举)

**问题**: 很多记录的 description 为空，导致 name 字段无法填充

### 3. materials 表
旧库字段：id, item_no, name, unit, price, currency, manufacturer, usage_amount...
新库字段：id, material_no, name, unit, price, currency, manufacturer, category...

**映射方案**:
- item_no → material_no ✅ (成功)

### 4. customers 表
旧库字段：id, vc_code, name, region, remark, created_at, updated_at, user_id
新库字段：id, code, name, region, note, created_by, updated_by, created_at, updated_at

**映射方案**:
- vc_code → code
- remark → note
- user_id → ?

**问题**: created_by, updated_by 字段在旧库中不存在（可能需设置为默认值）

### 5. models 表
旧库字段：id, regulation_id, model_name, model_category, is_active, model_series, calculation_type
新库字段：id, regulation_id, name, category, series, calculation_type

**映射方案**:
- model_name → name
- model_category → category
- model_series → series

### 6. packaging_configs 表
旧库字段复杂（16个字段）：id, model_id, config_name, pc_per_bag, bags_per_box...
新库字段：id, model_id, name, packaging_type, per_box, per_carton

**问题**: 新旧库结构差异很大，需要重新计算 per_box 和 per_carton

---

## 技术实现

### 成功实现的功能

1. **确定性 UUID 转换**: 使用 UUID v5 命名空间算法，确保同一表+ID 总是生成相同 UUID
2. **单记录事务**: 每条记录使用独立事务，单条失败不影响其他记录
3. **外键映射**: 正确处理外键引用关系
4. **枚举值映射**: 支持状态值的转换
5. **错误跳过**: 遇到错误记录自动跳过并记录

### 迁移脚本文件

- `scripts/uuid-converter.ts` - UUID 转换工具
- `scripts/migration-config.ts` - 字段映射和配置
- `scripts/migrate-data.ts` - 主迁移脚本
- `scripts/migration_report.json` - 详细迁移统计

---

## 后续建议

### 短期（立即执行）

1. **清理 users 表重复数据**
   ```sql
   -- 在旧库中清理重复邮箱
   -- 保留一条，删除其他重复记录
   ```

2. **修复核心字段映射**
   - 更新 migration-config.ts 中的字段映射
   - 特别关注 models, customers, packaging_configs 表

3. **处理缺失的外键字段**
   - customers 表的 created_by/updated_by
   - 可设置为系统管理员 UUID 作为默认值

### 中期（本周内）

1. **逐个表修复迁移**
   - 按照依赖顺序：regulations → models → customers → quotations
   - 每修复一个表就运行验证

2. **数据验证脚本**
   - 对比旧库和新库的关键字段值
   - 验证成本计算结果一致性

### 长期（下周）

1. **API 集成测试**
   - 使用新数据库运行后端 API
   - 测试所有 CRUD 操作

2. **性能优化**
   - 如果数据量大，考虑批量插入优化
   - 添加索引优化

---

## 命令参考

```bash
# 清空新数据库
docker exec cost-postgres psql -U postgres -d cost_analysis_v2 -c "
  TRUNCATE users, regulations, materials, customers, models,
  bom_materials, packaging_configs, process_configs,
  packaging_materials, quotations, standard_costs,
  notifications, system_config CASCADE;
"

# 运行迁移
pnpm tsx scripts/migrate-data.ts

# 查看迁移报告
cat scripts/migration_report.json

# 对比新旧库数据量
docker exec cost-postgres psql -U postgres -c "
  SELECT 'OLD' as db, COUNT(*) FROM cost_analysis.users
  UNION ALL
  SELECT 'NEW', COUNT(*) FROM cost_analysis_v2.users;
"
```

---

## 总结

本次迁移完成了基础框架搭建和核心工具开发：
- ✅ UUID 转换机制
- ✅ 单记录事务处理
- ✅ 错误跳过机制
- ✅ materials 表完整迁移
- ⚠️ users 表部分迁移（重复数据问题）
- ❌ 其他表需要字段映射修复

**下一步优先级**:
1. 修复字段映射配置（预计 2-3 小时）
2. 清理旧库重复数据（预计 30 分钟）
3. 重新运行完整迁移（预计 10 分钟）
4. 数据验证（预计 1 小时）
