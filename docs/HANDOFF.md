# Handoff 文档

> **最后更新**: 2026-06-17
> **交接人**: 八月团队 (Claude 4.6)
> **项目**: cost_demo_2 - 成本核算管理系统 v2
> **状态**: ✅ Phase 1 本地验证通过；4项审核返修已完成；资料模块增删改待修复

---

## 当前进展概览

```
Phase 1 代码:  ✅ 完成
Phase 1 本地验证: ✅ 完成 (API 测试 112/112 通过)
4项审核返修:  ✅ 完成
后端服务:      ⚠️ 当前未运行 (配置端口 3000)
前端服务:      ⚠️ 当前未运行
API对接:       ⚠️ 14个页面已迁移查询，但 customers/materials/models/regulations 增删改仍为假操作
数据迁移:      ✅ 29条quotations记录已导入
本地 PostgreSQL: ✅ Docker 容器运行中
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
| quotations | ✅ | 29/29 |

---

## 已完成工作

### ✅ 前端API对接完成

**14个页面已从硬编码迁移到真实API**:

| 类别 | 页面 |
|------|------|
| **基础数据** | customers, materials, regulations, models |
| **成本分析** | cost/records, cost/[id], cost/new, cost/standard, cost/compare |
| **审核流程** | review/pending, review/completed |
| **其他** | notifications, bom, processes, packaging |

**创建的API Hooks (9个)**:
- `use-customers.ts` - 客户数据
- `use-materials.ts` - 原料数据
- `use-models.ts` - 型号数据
- `use-regulations.ts` - 法规数据
- `use-quotations.ts` - 报价单数据
- `use-standard-costs.ts` - 标准成本
- `use-notifications.ts` - 通知数据
- `use-bom.ts` - BOM数据
- `use-packaging.ts` - 包装配置

### ✅ 数据迁移完成

- 29条quotations记录从旧库成功迁移
- 创建默认客户用于填充空值
- 修复customer_id和shipping_type外键约束

### ✅ 端口配置修复

前端API地址从 `3003` 修复为 `3000`

---

## 核心问题

### ❌ 问题 1: 资料模块增删改未接真实 API

**现象**: 在 `master/customers`、`master/materials`、`master/models`、`master/regulations` 页面点击「保存/删除」后仅显示 toast，数据未写入数据库。

**根因**:
1. 2026-03-13 迁移只补了这些模块的 `useQuery`，未补 `useMutation`
2. 对应页面 `handleSave`/`handleDelete` 只调用 `toast.success()`，未调用 API

**修复方案**:
1. 补全 `use-customers.ts`、`use-materials.ts`、`use-models.ts`、`use-regulations.ts` 的 `useMutation`
2. 修改对应 master 页面 `handleSave`/`handleDelete` 调用真实 API

### ❌ 问题 2: system 页面仍使用硬编码数据

**原因**: 后端 `/system-configs` API 已 ready，但 `system/page.tsx` 仍从 `lib/data.ts` 读取硬编码。

**修复方案**: 将 `system/page.tsx` 迁移到 `useSystemConfigs` hook。

---

## 已解决的问题

### ✅ 登录密码验证

`admin/admin123` 可正常登录。

### ✅ quotations 表为空

29条记录已成功迁移，`quotations` 表有数据。

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

前端API Hooks:
  - apps/web/hooks/api/use-customers.ts       # 客户数据
  - apps/web/hooks/api/use-materials.ts       # 原料数据
  - apps/web/hooks/api/use-models.ts          # 型号数据
  - apps/web/hooks/api/use-regulations.ts     # 法规数据
  - apps/web/hooks/api/use-quotations.ts      # 报价单数据
  - apps/web/hooks/api/use-standard-costs.ts  # 标准成本
  - apps/web/hooks/api/use-notifications.ts   # 通知数据
  - apps/web/hooks/api/use-bom.ts             # BOM数据
  - apps/web/hooks/api/use-packaging.ts       # 包装配置

迁移脚本:
  - scripts/migrate-data.ts              # 主迁移脚本（已运行）
  - scripts/migrate-quotations.ts        # 报价单迁移脚本（已运行）
  - scripts/fix-quotations-customer.ts   # 修复quotations（已更新）
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

## 架构审查记录

> **审查日期**: 2026-06-11
> **审查团队**: 八月团队 (Claude 4.6)
> **审查范围**: 后端API + 前端代码 + 数据库Schema + 项目进度

### 审查结论

当前代码处于**新旧架构迁移过渡期**，不是功能未开发完成：
- **前端**: 14/15页面已完成API迁移（93%）
- **后端**: 6/13路由按新架构分层，7个路由仍是旧架构内联代码（约46%）
- **数据库**: Schema完整，但部分外键索引缺失、Quotation/Notification关系未配置onDelete策略、无软删除机制

### 严重问题清单（必须修复）

| # | 问题 | 位置 | 类型 |
|---|------|------|------|
| 1 | 外键无索引（PostgreSQL不会自动创建） | schema.prisma 8个表 | 架构遗漏 |
| 2 | quotationNo并发竞争（非原子生成） | quotation.service.ts:53-62 | 旧架构遗留 |
| 3 | StandardCost版本切换非原子操作 | standard-costs.routes.ts:240-248, 325-333 | 旧架构遗留 |
| 4 | 两套重复响应工具函数 | utils/http-response.ts + lib/response-helpers.ts | 迁移残留 |
| 5 | 大量接口缺少Zod验证（`request.body as`） | packaging/models/bom/standard-costs/notifications等 | 旧架构遗留 |
| 6 | 多处Controller无try-catch | user/customer.controller.ts | 旧架构遗留 |
| 7 | 7个路由模块直接调用Prisma（无分层） | auth/dashboard/models/bom/regulations/standard-costs/notifications | 旧架构遗留 |
| 8 | API类型完全丢失（unknown泛滥） | lib/api.ts | 迁移遗留 |
| 9 | 页面组件严重臃肿（超600行） | system/page.tsx, cost/new/page.tsx | 旧架构遗留 |

### 新旧架构对照

**已完成新架构（5个模块）**:
- users, customers, materials, quotations, packaging

**待重构旧架构（7个路由）**:
- auth.routes.ts, dashboard.routes.ts, models.routes.ts, bom.routes.ts, regulations.routes.ts, standard-costs.routes.ts, notifications.routes.ts

**不可立即删除的迁移残留**:
- `apps/web/lib/data.ts`（仍被 `system/page.tsx` 导入使用，需先完成 system-config 页面迁移后才能删除）

### 真正缺失的功能（非迁移遗留）

1. **system-config 后端API** — system页面仍硬编码，缺CRUD端点
2. **角色权限中间件** — 所有路由只有`authenticate`，无`requireRole`
3. **数据库级约束** — 无CHECK约束、无软删除、无外键索引

---

## 当前实际进度（2026-06-17）

### ✅ Phase 1 已完成并通过验证

| 任务 | 状态 | 关键证据 |
|------|------|----------|
| 1.1 外键索引 | ✅ 完成 | `schema.prisma` 已添加索引；`SequenceNumber` 已补 `@@index([prefix])` |
| 1.2 并发安全 | ✅ 完成 | `sequence.service.ts` 使用 `upsert`；`standard-costs.routes.ts` 版本切换移入事务 |
| 1.3 system-config API | ✅ 完成 | controller/service/route/hook 已创建 |
| 1.4 角色权限中间件 | ✅ 完成 | `role-check.ts` 已创建，users/materials/quotations 路由已接入 |
| 4项审核返修 | ✅ 完成 | API 测试 `112/112` 通过 |

**验证结果**:
```bash
cd apps/api && pnpm test
# Test Files  10 passed (10)
# Tests       112 passed (112)
```

### ⚠️ 新发现问题：资料模块增删改未接真实 API

**现象**: 在 `master/customers`、`master/materials`、`master/models`、`master/regulations` 页面点击「保存/删除」后仅显示 toast，数据未写入数据库。

**根因**:
- 2026-03-13 迁移只补了这些模块的 `useQuery`，未补 `useMutation`
- 对应页面 `handleSave`/`handleDelete` 只调用 `toast.success()`，未调用 API

**计划**: 下一步补全 mutation hooks 并修改页面调用。

---

## Phase 1 执行记录（2026-06-11 ~ 2026-06-17）

### 已完成的代码修改

| 任务 | 状态 | 修改文件数 | 关键变更 |
|------|------|-----------|---------|
| **1.1 外键索引** | ✅ 完成 | 1 | schema.prisma 添加9个模型索引，新增 SequenceNumber 模型，已补 `@@index([prefix])` |
| **1.2 并发安全** | ✅ 完成 | 4 | sequence.service.ts, quotation.service.ts, standard-costs.routes.ts, material.service.ts |
| **1.3 system-config API** | ✅ 完成 | 6 | service, controller, route, index.ts, api.ts, hook, shared-types |
| **1.4 角色权限** | ✅ 完成 | 4 | role-check.ts, users/materials/quotations.routes.ts |
| **审核返修** | ✅ 完成 | 6 | 4项严重问题全部修复，测试通过 |

### 已执行的本地验证

```bash
cd D:\Desktop\cost_demo_2

# 1. 安装依赖
pnpm install

# 2. 生成 Prisma Client 并执行迁移
pnpm db:generate
pnpm db:migrate

# 3. API 测试
cd apps/api && pnpm test
# Test Files  10 passed (10)
# Tests       112 passed (112)
```

### 审核返修项（4项严重问题）— 全部完成

| # | 问题 | 修复位置 | 验证 |
|---|------|----------|------|
| 1 | `material.service.ts:120` `triggeredBy: ''` 硬编码 | `material.service.ts` + `material.controller.ts` | 测试通过 |
| 2 | `role-check.ts:5` `request.user` 类型断言不安全 | `role-check.ts` | 测试通过 |
| 3 | `standard-costs.routes.ts:232` `lastVersion` 查询在事务外 | `standard-costs.routes.ts` | 测试通过 |
| 4 | `sequence.service.ts` 并发竞争 | `sequence.service.ts` + 迁移 | 测试通过 |

返修方案详见 `docs/plans/2026-06-11-architecture-fix-plan.md` → 「审核记录」章节。

---

## 下一步任务

### 🔴 高优先级（功能补齐 + 数据一致）

1. **修复资料模块增删改未接 API** (1-2小时)
   - 补全 `use-customers.ts`、`use-materials.ts`、`use-models.ts`、`use-regulations.ts` 的 `useMutation`
   - 修改对应 master 页面 `handleSave`/`handleDelete` 调用真实 API
   - 验证：新增/编辑/删除后数据持久化

2. **开发 system-config 前端页面** (1小时)
   - `system/page.tsx` 迁移到真实 API（后端 API 已 ready）
   - 删除 `apps/web/lib/data.ts` 迁移残留

### 🟡 中优先级（代码整洁度）

5. **合并两套响应工具函数** (30分钟)
   - 统一使用 `lib/response-helpers.ts`
   - 删除 `utils/http-response.ts`

6. **为旧路由补充Zod验证** (2小时)
   - models/bom/regulations/standard-costs 添加schema定义
   - 替换所有 `request.body as` 为Zod解析

7. **拆分臃肿页面组件** (3小时)
   - system/page.tsx (646行) → 拆分为子组件
   - cost/new/page.tsx (632行) → 拆分为步骤子组件

8. **删除迁移残留文件** (10分钟)
   - 删除 `apps/web/lib/data.ts`
   - 删除未使用的旧类型定义

### 🟢 低优先级（重构旧架构）

9. **将7个旧路由重构为分层架构** (8小时)
   - 提取Controller/Service/Repository
   - 统一错误处理和响应格式

10. **完善类型安全** (4小时)
    - 替换API层的 `unknown[]` 为具体类型
    - 同步 `shared-types` 与 Prisma 类型

---

## 验证清单

### 接手基础验证

- [ ] 后端服务运行 `curl http://localhost:3000/health`
- [ ] 前端服务运行 `curl -I http://localhost:5174`
- [ ] 数据库连接正确 `docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT COUNT(*) FROM users;"`
- [ ] **API对接验证**：访问 http://localhost:5174/cost/records 显示Loading后加载真实数据
- [ ] **客户数据验证**：运行 `docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT name FROM customers LIMIT 5;"`
- [ ] **报价单数据验证**：运行 `docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT COUNT(*) FROM quotations;"` (应返回29)

### Phase 1 功能验证（新增）

- [x] **外键索引检查**：`docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT indexname FROM pg_indexes WHERE tablename='quotations';"` (已看到customer_id、model_id等索引)
- [x] **SequenceNumber表存在**：`docker exec cost-postgres psql -U postgres -d cost_analysis_new -c "SELECT COUNT(*) FROM sequence_numbers;"`
- [x] **system-config API可用**：`curl http://localhost:3000/api/v1/system-configs` 返回配置列表
- [x] **角色权限生效**：非admin用户调用POST /users 返回403
- [x] **并发安全**：同时创建2个报价单，quotationNo不重复

### Phase 1 审核返修验证（必须）

- [x] **material.service.ts** — `triggeredBy` 不再为空字符串，通知记录包含操作用户ID
- [x] **role-check.ts** — TypeScript编译通过，无类型错误
- [x] **standard-costs.routes.ts** — `lastVersion` 查询移入 `$transaction` 内部
- [x] **sequence.service.ts** — 使用 `upsert` 替代 `findUnique + create`

### 新增问题验证（待完成）

- [ ] **customers/materials/models/regulations 增删改** — 操作后数据库真实持久化
- [ ] **system 页面** — 访问 `/system` 加载真实 API 数据而非硬编码

### 架构合规性验证（后续阶段）

- [ ] **分层架构检查**：确认 `models.routes.ts`、`bom.routes.ts` 等7个路由是否已提取Controller/Service/Repository
- [ ] **Zod验证检查**：确认所有POST/PUT接口不再使用 `request.body as` 类型断言
- [ ] **system页面检查**：访问 http://localhost:5174/system 确认加载真实API数据而非硬编码
- [ ] **角色权限检查**：敏感接口（如用户创建）是否返回403给非admin角色

---

## 备注

- 后端已正确连接 `cost_analysis_new`（真实数据）
- ✅ 前端14个页面查询已接入真实API
- ⚠️ `customers/materials/models/regulations` 的增删改仍为假操作（只显示toast）
- ✅ 29条quotations记录已成功迁移
- ⚠️ `system/page.tsx` 仍使用硬编码数据（后端API已ready，待前端迁移）
- ✅ 所有API hooks已创建并导出
- ✅ 端口配置已修复 (3003→3000)
- ✅ API 测试 112/112 通过

### 最近提交

```
commit 086b51c
fix: 修复API Hook数据解析和页面数据展示问题

commit bcb80d4
feat: 前端硬编码数据迁移到真实API调用
- 迁移14个页面从lib/data到API hooks
- 创建9个API hooks
- 添加数据迁移脚本
- 修复端口配置
```

---

*交接完成。如有疑问，请查阅 `.memory/memory.md` 获取更详细的项目背景。*
