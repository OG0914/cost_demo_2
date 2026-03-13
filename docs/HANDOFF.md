# Handoff 文档

> **最后更新**: 2026-03-13
> **交接人**: Claude (雪球团队)
> **项目**: cost_demo_2 - 成本核算管理系统 v2
> **状态**: 🟡 数据层完成，前端待对接真实API

---

## 当前进展概览

```
数据库迁移: ✅ 完成 (699/731 条记录，95.6%)
后端服务:   ✅ 运行中 (端口 3000)
前端服务:   ✅ 运行中 (端口 5174)
API对接:    ❌ 未开始 (页面使用硬编码演示数据)
```

### 数据库状态

| 数据库 | 用途 | 连接数 |
|--------|------|--------|
| `cost_analysis` | 旧库（真实数据源） | 0 |
| `cost_analysis_v2` | 原演示库 | 0 |
| `cost_analysis_new` | ✅ **当前使用**（迁移后的真实数据） | 6 |

### 迁移结果详情

| 表名 | 状态 | 记录数 |
|------|------|--------|
| users | ✅ | 8 |
| customers | ✅ | 16 |
| materials | ✅ | 50 |
| models | ✅ | 23 |
| bom_materials | ✅ | 90 |
| packaging_configs | ✅ | 63 |
| process_configs | ✅ | 322 |
| packaging_materials | ✅ | 92 |
| standard_costs | ✅ | 1 |
| system_config | ⚠️ | 31/34 |
| quotations | ❌ | 0/29 |

---

## 核心问题（需要下一个 Agent 解决）

### ❌ 问题 1: 前端使用硬编码演示数据

**现象**: 成本记录页面显示 QT-2026-0001、3M中国 等演示数据

**原因**: `apps/web/app/(app)/cost/records/page.tsx` 第 46 行：
```typescript
import { quotations, regulations, getQuotationWithDetails } from '@/lib/data'
```

**解决方案**: 替换为 API hook：
```typescript
import { useQuotations } from '@/hooks/api/use-quotations'
const { quotations, isLoading } = useQuotations()
```

**相关文件**:
- `apps/web/lib/data.ts` - 硬编码演示数据
- `apps/web/hooks/api/use-quotations.ts` - 真实API hook
- `apps/web/lib/api.ts` - API 客户端

### ❌ 问题 2: 登录密码验证失败

**现象**: admin/admin123 返回 "用户名或密码错误"

**排查步骤**:
1. 后端配置正确连接 `cost_analysis_new`
2. 数据库中 admin 密码 hash 已设置
3. 可能是 bcrypt 版本不兼容或后端缓存问题

**验证命令**:
```bash
# 检查后端连接的数据库
curl http://localhost:3000/health

# 检查数据库中的用户
docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT username, name FROM users;"
```

### ❌ 问题 3: quotations 表为空

**原因**: 迁移时29条记录因外键约束失败
- customer_id 为 NULL
- shipping_type 为 NULL

**修复脚本**: `scripts/fix-quotations-customer.ts`
```bash
npx tsx scripts/fix-quotations-customer.ts
```

---

## 环境配置

### 后端
```
apps/api/.env:
DATABASE_URL="postgresql://postgres:1998@localhost:5432/cost_analysis_new"
PORT=3000
JWT_SECRET="your-jwt-secret-change-in-production"
```

### 前端
```
apps/web/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 数据库连接
```
Host: localhost
Port: 5432
Database: cost_analysis_new
User: postgres
Password: 1998
```

---

## 启动命令

```bash
# 启动前后端
pnpm dev

# 后端 http://localhost:3000
# 前端 http://localhost:5174
# Swagger http://localhost:3000/documentation

# 单独启动
pnpm dev:api  # 后端
pnpm dev:web  # 前端
```

---

## 关键文件位置

```
项目根目录: E:/desktop/cost_demo_2

后端:
  - apps/api/.env                    # 数据库配置
  - apps/api/src/routes/auth.routes.ts  # 登录逻辑

前端问题文件:
  - apps/web/app/(app)/cost/records/page.tsx  # 使用硬编码数据
  - apps/web/lib/data.ts                      # 硬编码演示数据
  - apps/web/hooks/api/use-quotations.ts      # 真实API hook

迁移脚本:
  - scripts/migrate-data.ts              # 主迁移脚本（已运行）
  - scripts/fix-quotations-customer.ts   # 修复quotations（待运行）
  - scripts/migration_report.json        # 迁移报告
```

---

## 真实数据示例

迁移后的 `cost_analysis_new` 包含真实业务数据：

**客户**:
- QSS SAFETY
- PHOL DHANY
- PT BERKAT
- P.S.P. MAR
- PARISON IN

**物料**:
- 蓝色鬆緊帶 6.8mm
- 白棉 內層 6D
- 熱熔棉 内層 4D

**用户**:
- admin
- KEN (E50491)
- winky (E50494)
- Heidi (E50490)
- 国玲 (E50492)
- Polly (E50493)
- 德坤 (E50495)
- admin2 (E99999)

---

## 下一步任务

### 高优先级

1. **修复前端API对接** (2-3小时)
   - 修改 `cost/records/page.tsx`
   - 替换 `lib/data.ts` 导入为 `useQuotations` hook
   - 验证页面显示真实数据

2. **修复登录问题** (1小时)
   - 检查 bcrypt 版本兼容性
   - 或重置密码使用测试hash
   - 验证登录成功后获取 token

### 中优先级

3. **修复 quotations 迁移** (1小时)
   - 运行 `scripts/fix-quotations-customer.ts`
   - 验证29条报价单导入

4. **清理未提交修改** (30分钟)
   - `git status` 查看当前修改
   - 决定哪些需要提交

---

## 验证清单

接手后请验证：

- [ ] 后端服务运行 `curl http://localhost:3000/health`
- [ ] 前端服务运行 `curl -I http://localhost:5174`
- [ ] 数据库连接正确 `docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT COUNT(*) FROM users;"`
- [ ] 确认显示硬编码数据：访问 http://localhost:5174/cost/records 看到 QT-2026-0001
- [ ] 查看真实数据：运行 `docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT name FROM customers LIMIT 5;"`

---

## 备注

- 后端已正确连接 `cost_analysis_new`（真实数据）
- 前端显示的是 `lib/data.ts` 中的硬编码演示数据
- 核心问题是前端未调用API，而是使用本地mock数据
- 其他页面可能也有同样问题，需要逐一检查

---

*交接完成。如有疑问，请查阅 `.memory/memory.md` 获取更详细的项目背景。*
