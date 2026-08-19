# Handoff 文档

> **最后更新**: 2026-08-19
> **交接人**: 八月团队 (Claude Fable 5)
> **项目**: cost_demo_2 - 成本核算管理系统 v2
> **状态**: ✅ 方案A（4 个遗留缺陷修复）已提交于 worktree 分支 `fix/quote-save-and-auth`（3 commits），待 Lucas 终审后合并 main；下一项：计算规则对齐计划

---

## 当前进展概览

```
Phase 1 代码:  ✅ 完成
Phase 1 本地验证: ✅ 完成 (API 测试 114/114 通过)
Phase 2 基线提交: ✅ 完成 (d763e6f)
4项审核返修:  ✅ 完成
资料模块增删改: ✅ 已接真实 API + 删除提示增强
system 页面:    ✅ 已迁移到真实 API
用户删除检查:   ✅ 后端已检查关联业务数据并返回明确提示
删除确认弹窗:   ✅ 8 个页面统一为 ConfirmDeleteDialog 组件
种子数据 UUID:  ✅ 所有实体 ID 已改为 UUID 格式
删除成功提示:   ✅ 已显示具体项目名称
响应工具函数合并: ✅ 已统一为 lib/response-helpers.ts
旧路由 Zod 验证: ✅ 已补充 schema 并替换 request.body as 断言
包材关联原料:  ✅ 已提交并推送 main (`ece8942`)
BOM 复制功能:   ✅ 已接真实 API（`POST /api/v1/bom/copy`）
登录页自动刷新: ✅ 已修复（切换 webpack 后稳定）
前端类型债修复: ✅ 已提交（`6e1dfc6`）
方案A 缺陷修复: ✅ 3 commits 于 worktree 分支 fix/quote-save-and-auth，待合并 main
后端测试:      ✅ 146/146 通过（+10 新增）
前端测试:      ✅ 60/60 通过（+1 新增）
后端服务:      ✅ 运行中 (http://localhost:3000，worktree)
前端服务:      ✅ 运行中 (http://localhost:5174，webpack 模式)
数据迁移:      ⚠️ 重新 seed 后真实数据已清空，需重新迁移
本地 PostgreSQL: ✅ 运行中（Lucas 手动启动）
```

### 当前重点任务（2026-06-29 ~ 2026-07-01）

| 任务 | 状态 | 说明 |
|------|------|------|
| **Task 1: 产品系列/分类改为系统配置维护** | ✅ 已提交 (`9298246`) | `system/page.tsx` 已引入 `ModelDictionaryConfig`，`models/page.tsx` 已读取 SystemConfig |
| **Task 2: BOM 复制功能完整实现** | ✅ 已完成 | 前端 `bom/page.tsx` 已调用真实 `POST /api/v1/bom/copy`；后端 copy 端点与 service 测试已存在并验证通过 |
| **Task 3: 标准包装类型复刻 + 包材关联原料 + 运费计算** | ✅ 已提交并推送 main (`ece8942`) | `PackagingMaterial` 关联 `Material` 表；新增 4 种标准包装类型、层级计算、boxVolume、LCL/FCL 运费；前端包装配置页/型号管理同步完成 |
| **Task 4: 前端类型债修复（扁平 Quotation + 运行时 bug 修复）** | ✅ 已提交 (`6e1dfc6`) | 补全 `@cost/shared-types` 的 `Quotation`/`PackagingConfig`，13 个文件 `q.costs.X → q.X`；修复 `cost/new` 选择型号后包装配置不加载、下一步禁用问题；前端 typecheck 0 错误、测试 59 passed、后端 136 passed |

---

## ✅ 方案A：4 个遗留缺陷修复（2026-08-19）

在 `.worktrees/fix-quote-save` worktree（分支 `fix/quote-save-and-auth`）完成，共 11 个文件（+396/-11），拆 3 个 commit，**待 Lucas 终审后合并 main**：

| Commit | 内容 |
|--------|------|
| `a52e8ca` | fix(api): system-config 路由补充鉴权中间件（2 文件，+71/-3） |
| `e9833e7` | fix(api): 报价单支持按客户名称创建并补全响应 schema（6 文件，+290/-3） |
| `6579bde` | fix(web): 成本记录页接入删除功能并本地化时间显示（3 文件，+35/-5） |

### 根因与修复

1. **P0 安全缺口**：`system-config.routes.ts` 3 个端点未挂任何鉴权（全系统 60+ 端点唯独它们裸奔）→ 补 `onRequest: [app.authenticate]`。未加 `requireRole('admin')`，因型号字典等非 admin 角色也在用。
2. **报价单保存失败（customerName）**：Zod（`schemas.ts`）与路由 JSON Schema（`swagger-schemas.ts`）双份定义均改为 customerId/customerName 二选一；`quotation.service.ts` 新增 `createCustomerByName()` 自动建档（编号 `CUST-年-序号`，region 占位「未填写」可后补）。
3. **成本记录页空白（连环案）**：真凶是 Fastify 响应 schema（`quotationSchema`）漏声明 `quotationNo` 与关联对象，fast-json-stringify 序列化时裁字段；前端 `useListFilters` 空搜索词仍要求字段为 string，误过滤全部行放大问题。已补全 schema + 空搜索放行 + 路由级 inject 回归测试（单测抓不到序列化层问题）。
4. **无法删除 + 时间非北京时间**：删除菜单项无 onClick（死按钮）→ 接 `ConfirmDeleteDialog` + delete mutation；`createdAt` 原始 ISO → `formatDateTime` 本地化（浏览器时区即北京时间）。

### 验证结果

| 检查项 | 结果 |
|---|---|
| 后端测试 | **146/146**（+10） |
| 前端测试 | **60/60**（+1） |
| typecheck / lint | 6/6、4/4 全绿 |
| 运行态实证 | records 页有数据；customerName E2E 创建 QT-2026-0007 + 自动建档 CUST-2026-0001（测试数据已清理） |

### 已知遗留

- 成本记录列表页「提交审核」菜单项同为死按钮（无 onClick），Lucas 确认暂缓；草稿单从详情页提交。审核流转无需预设审核人：submit 仅置 `status=submitted` 进待审核池，reviewer/admin 在 `/review/pending` 处理时记录 `reviewedBy`。
- 历史报价单可能存在 saleType=export 但 vat>0 的旧数据不一致，优先判定为旧数据问题。
- 删除后端规则：approved 不可删（INVALID_STATUS），draft/submitted/rejected 可删。

---

## ✅ Task 3 完成说明（2026-06-30）

Task 3 已按 `docs/plans/2026-06-25-task3-packaging-material-plan.md` 实施完毕，并随 `ece8942` 提交并推送至 main。

### 交付内容

- **标准包装类型**：`PackagingConfig.packagingType` 规范为 `standard_box` / `no_box` / `blister_direct` / `blister_bag`
- **层级计算**：新增 `layer1/layer2/layer3`，后端自动计算 `perBox/perCarton`
- **包材关联原料**：`PackagingMaterial` 新增 `materialId`，移除 `name/price`，价格运行时从 `Material` 读取
- **外箱材积**：`PackagingMaterial` 新增 `boxVolume`（CUFT），用于运费计算
- **运费计算**：`cost-calculator.ts` 实现 LCL（按 CBM 档位）与 FCL（按柜型容积）公式
- **系统配置**：`/system` 页支持维护 LCL 档位价格、FCL 容积、固定费用
- **前端组件**：新增 `SearchableSelect` 可搜索下拉；包装配置页支持增删改/包材管理
- **型号管理同步**：型号列表聚合 BOM/包装配置真实计数，详情弹窗展示真实数据

### 关键提交

```
commit ece8942
@ feat: 复刻旧系统标准包装类型与运费计算
```

### 验证结果

- 后端测试：`136/136` 通过
- 前端类型检查：本次修改的页面/组件无新增类型错误
- 浏览器验收：已通过 Lucas 多轮验收反馈

---

## ✅ Task 4 完成说明（2026-06-30 ~ 2026-07-01）

Task 4 已按 `docs/plans/2026-06-30-frontend-type-debt-fix.md` 实施完毕，当前状态为**已实施完成，待 Lucas 运行态审查通过后提交**。

### 交付内容

- **类型对齐**：`@cost/shared-types` 的 `Quotation` 补全 `regulationId`/`regulation`/`reviewedAt`，`saleType`/`shippingType`/`status` 收窄为联合类型，新增 `PackagingConfig` 接口替换 `packagingConfig?: unknown`
- **扁平成本字段**：`cost/[id]`、`cost/compare`、`cost/records`、`review/pending`、`review/completed` 等页面统一从 `q.costs?.X` 改为 `q.X`
- **运行时 bug 修复**：`cost/new/page.tsx` 中 `modelApi.getPackagingConfigs` 与 `quotationApi.calculate` 因 axios 拦截器已 unwrap 信封，原代码多取了一层 `.data`，导致选择型号后包装配置为空、下一步按钮禁用。已修正为 `response.data`
- **外围类型修复**：`notifications/page.tsx` 加 `materials?.find`、`master/processes/page.tsx` 补充 `packagingConfigId`、`error-boundary.tsx` 归一化 `null`/`undefined`、`use-bom.ts` 显式 `BomMaterialItem` 类型
- **测试修复**：`use-quotations.test.ts` 用 `act()` 包裹 mutation 调用，修正 React Query v5 第二个参数导致的断言不匹配问题

### 改动文件（13 个）

```
packages/shared-types/src/index.ts
packages/shared-types/src/api.ts
apps/web/app/(app)/cost/[id]/page.tsx
apps/web/app/(app)/cost/compare/page.tsx
apps/web/app/(app)/cost/new/page.tsx
apps/web/app/(app)/cost/records/page.tsx
apps/web/app/(app)/review/pending/page.tsx
apps/web/app/(app)/review/completed/page.tsx
apps/web/app/(app)/notifications/page.tsx
apps/web/app/(app)/master/processes/page.tsx
apps/web/components/error-boundary.tsx
apps/web/hooks/api/use-bom.ts
apps/web/hooks/use-quotations.test.ts
```

### 验证结果

| 检查项 | 结果 |
|---|---|
| 前端 typecheck | **0 错误** |
| 前端测试 | **59 passed** |
| 后端测试 | **136 passed** |

### 已知后续问题

1. `cost/new/page.tsx` 的 `handleSubmit` 尚未把 `calculateCosts` 返回的 7 个成本字段传入 `createQuotation`，实际保存会失败；需后续任务补齐。
2. 后端 `quotation.service.ts` 未处理 `customerName`（新客户名）创建逻辑，填写新客户名保存也会失败。

### 2026-06-24 新增工作（三项 Bug 修复）

**计划文件**: `docs/plans/2026-06-24-bug-fixes-plan.md`

| 问题 | 选定方案 | 状态 | 关键文件 |
|------|---------|------|---------|
| 1. 产品系列硬编码 | A（系列+分类均改为 SystemConfig 维护） | ✅ 已提交 (`9298246`) | `apps/web/app/(app)/system/page.tsx`、`apps/web/app/(app)/master/models/page.tsx`、`apps/web/components/system/model-dictionary-config.tsx`、`apps/web/components/system/model-dictionary-card.tsx` |
| 2. BOM 复制假成功 | B（完整实现后端 copy API + 前端调用） | ✅ 已完成 | `apps/web/hooks/api/use-bom.ts`、`apps/web/app/(app)/master/bom/page.tsx`；后端 copy 端点与测试已存在 |
| 3. 包材手动输入名称 | A（PackagingMaterial 完全关联 Material 表） | ✅ 已提交并推送 main (`ece8942`) | `packages/database/prisma/schema.prisma`、共享类型、backend service/repository/controller/tests、frontend hook/page |

**Task 1 已完成的代码变更**:
- 新建 `apps/web/components/system/model-dictionary-card.tsx` — 可复用的字典维护卡片（增/删/输入）
- 新建 `apps/web/components/system/model-dictionary-config.tsx` — 加载并保存 `modelSeries` / `modelCategories` 两个 SystemConfig
- 修改 `apps/web/app/(app)/system/page.tsx` — 在「系统配置」Tab 引入 `ModelDictionaryConfig`，避免继续膨胀
- 修改 `apps/web/app/(app)/master/models/page.tsx` — 移除硬编码 `categories`/`series` 数组，改为 `useSystemConfig` 读取配置并回退到默认值

**Task 3 方案 A 关键决策**（已写入计划文件）：
- `PackagingMaterial` 新增必填 `materialId`，移除 `name` / `price` 字段
- `name`、`price` 运行时从 `Material` 表读取
- 开发阶段旧 `packaging_materials` 数据直接丢弃（迁移脚本先 `TRUNCATE`）
- 所有提交需经 Lucas 明确确认

### 数据库状态

| 数据库 | 用途 | 连接数 |
|--------|------|--------|
| `cost_analysis` | 旧库（真实数据源） | 0 |
| `cost_analysis_v2` | 原演示库 | 0 |
| `cost_analysis_new` | ✅ **当前使用** | 6 |

### 当前数据状态（2026-06-23 重新 seed 后）

| 表名 | 状态 | 记录数 | 备注 |
|------|------|--------|------|
| users | ✅ | 3 | 种子用户（admin/purchaser/reviewer），ID 已为 UUID |
| customers | ✅ | 5 | 种子客户 |
| materials | ✅ | 8 | 种子原料 |
| models | ✅ | 6 | 种子型号 |
| bom_materials | ✅ | 10 | 种子 BOM |
| packaging_configs | ✅ | 5 | 种子包装配置 |
| process_configs | ✅ | 8 | 种子工序配置 |
| packaging_materials | ✅ | 0 | 已关联 `materials` 表，字段为 `material_id`/`quantity`/`box_volume`；Task 3 迁移时清空旧数据，当前种子数据中无示例包材，需通过 UI 维护 |
| system_config | ✅ | 6+ | 种子系统配置，新增 LCL/FCL 运费参数 |
| quotations | ⚠️ | 0 | **重新 seed 清空了此前迁移的 29 条报价单数据** |
| standard_costs | ⚠️ | 0 | 已清空 |
| notifications | ⚠️ | 0 | 已清空 |

**注意**：本次为修复种子数据 UUID 格式，执行了 `pnpm db:seed`，该脚本会先清空全表再写入种子数据，因此此前通过迁移脚本导入的真实业务数据（29 条 quotations、16 个 customers 等）已被清除。如需恢复，需重新运行迁移脚本。

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

### ❌ 问题 1: system 页面仍使用硬编码数据

**原因**: 后端 `/system-configs` API 已 ready，但 `system/page.tsx` 仍从 `lib/data.ts` 读取硬编码。

**修复方案**: 将 `system/page.tsx` 迁移到 `useSystemConfigs` hook。

---

## 已解决的问题

### ✅ 登录密码验证

`admin/admin123` 可正常登录。

### ✅ quotations 表为空

29条记录已成功迁移，`quotations` 表有数据。

### ✅ 资料模块增删改未接真实 API

2026-06-18 已修复：
- 补全 `use-customers.ts`、`use-materials.ts`、`use-models.ts`、`use-regulations.ts`、`use-bom.ts` 的 `useMutation`（create/update/delete）
- 修改对应 master 页面 `handleSave`/`handleDelete` 调用真实 API
- `materials` price 字符串转 number
- `regulations` 新增 code 输入框
- 修复 BOM 页面默认选中第一个型号但 hook 未查询的问题（`useBom` 内部计算 `effectiveModelId`）
- 修复 BOM 路由 UUID schema 与迁移后 string ID 不匹配的问题
- 删除成功 toast 现在显示具体项目名称，例如 `客户 "ABC公司" 已删除`、`原料 "无纺布" 已从BOM移除`
- API 回归测试 112/112 通过
- 待 Lucas 在浏览器中做最终端到端验证

### ✅ 删除成功提示缺少具体信息

2026-06-18 已修复：
- 所有资料模块（customers/materials/models/regulations）删除成功后 toast 显示被删除项名称
- BOM 移除原料成功后 toast 显示原料名称
- BOM 删除确认弹窗也同步显示原料名称
- 删除按钮保持白底红字红图标的统一风格

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
项目根目录: D:/Desktop/cost_demo_2

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

## 当前实际进度（2026-06-22）

### ✅ Phase 1 已完成并通过验证

| 任务 | 状态 | 关键证据 |
|------|------|----------|
| 1.1 外键索引 | ✅ 完成 | `schema.prisma` 已添加索引；`SequenceNumber` 已补 `@@index([prefix])` |
| 1.2 并发安全 | ✅ 完成 | `sequence.service.ts` 使用 `upsert`；`standard-costs.routes.ts` 版本切换移入事务 |
| 1.3 system-config API | ✅ 完成 | controller/service/route/hook 已创建 |
| 1.4 角色权限中间件 | ✅ 完成 | `role-check.ts` 已创建，users/materials/quotations 路由已接入 |
| 1.7 资料模块增删改 | ✅ 完成 | 5 个 hooks + 5 个页面已接真实 API，API 测试 112/112 通过 |
| 删除成功提示增强 | ✅ 完成 | 删除 toast 显示具体项目名称 |
| 4项审核返修 | ✅ 完成 | API 测试 `112/112` 通过 |

**验证结果**:
```bash
cd apps/api && pnpm test
# Test Files  10 passed (10)
# Tests       112 passed (112)
```

### ✅ 新发现问题已解决：资料模块增删改未接真实 API

**现象**: 在 `master/customers`、`master/materials`、`master/models`、`master/regulations` 页面点击「保存/删除」后仅显示 toast，数据未写入数据库。

**修复结果**:
- 已补全 `use-customers.ts`、`use-materials.ts`、`use-models.ts`、`use-regulations.ts`、`use-bom.ts` 的 `useMutation`
- 已修改对应 master 页面 `handleSave`/`handleDelete` 调用真实 API
- 删除成功 toast 现在显示具体项目名称
- API 测试 112/112 通过
- 待 Lucas 在浏览器中做最终端到端验证

---

## Phase 1 执行记录（2026-06-11 ~ 2026-06-22）

### 已完成的代码修改

| 任务 | 状态 | 修改文件数 | 关键变更 |
|------|------|-----------|---------|
| **1.1 外键索引** | ✅ 完成 | 1 | schema.prisma 添加9个模型索引，新增 SequenceNumber 模型，已补 `@@index([prefix])` |
| **1.2 并发安全** | ✅ 完成 | 4 | sequence.service.ts, quotation.service.ts, standard-costs.routes.ts, material.service.ts |
| **1.3 system-config API** | ✅ 完成 | 6 | service, controller, route, index.ts, api.ts, hook, shared-types |
| **1.4 角色权限** | ✅ 完成 | 4 | role-check.ts, users/materials/quotations.routes.ts |
| **1.7 资料模块增删改** | ✅ 完成 | 10 | 5 个 hooks + 5 个 master 页面接入真实 API，删除提示显示具体名称 |
| **审核返修** | ✅ 完成 | 6 | 4项严重问题全部修复，测试通过 |

### 2026-06-22 新增修复

| 模块 | 修改文件 | 关键变更 |
|------|---------|---------|
| 客户管理 | `hooks/api/use-customers.ts`, `master/customers/page.tsx` | delete mutation 接收 `{id, name}`，toast 显示客户名称 |
| 原料管理 | `hooks/api/use-materials.ts`, `master/materials/page.tsx` | delete mutation 接收 `{id, name}`，toast 显示原料名称 |
| 型号管理 | `hooks/api/use-models.ts`, `master/models/page.tsx` | delete mutation 接收 `{id, name}`，toast 显示型号名称 |
| 法规管理 | `hooks/api/use-regulations.ts`, `master/regulations/page.tsx` | delete mutation 接收 `{id, name}`，toast 显示法规名称 |
| BOM 管理 | `hooks/api/use-bom.ts`, `master/bom/page.tsx` | delete mutation 接收 `{id, materialName}`，toast 显示原料名称；修复默认选中型号不查询 BOM 的问题 |

### 2026-06-23 新增修复

| 模块 | 修改文件 | 关键变更 |
|------|---------|---------|
| API 类型统一 | `apps/web/lib/api.ts` | `createCrudApi` 默认 `ListType` 从 `ListResponse<T>` 改为 `T[]`，与后端 `{ success, data: T[], meta }` 一致；移除 `regulationApi` 特殊处理；`systemConfigApi` 修正为 `ApiResponse<SystemConfig>` |
| 用户列表 | `apps/web/hooks/api/use-users.ts` | 移除 `as unknown as ApiResponse<User[]>` 强转；补全 create/update/delete mutations |
| 系统配置 | `apps/web/hooks/api/use-system-config.ts` | 移除多处 `as unknown` 强转，修正类型 |
| 报价单分页 | `apps/web/hooks/api/use-quotations.ts` | `queryFn` 返回 `{ data, meta }`，hook 返回真实 `meta` |
| 用户删除 | `apps/api/src/services/user.service.ts` | 删除前检查 quotation/customer/standardCost/notification 关联数据，返回 409 冲突错误，提示第一条关联数据及总数 |
| 用户删除测试 | `apps/api/src/services/user.service.test.ts` | 新增无关联/单关联/多关联删除测试 |
| 统一删除弹窗 | `apps/web/components/confirm-delete-dialog.tsx`（新建） | 白底红字红边框 + Trash2 图标的统一删除确认组件 |
| 页面替换 | 8 个 master 页面 + system 页面 | 将内联 `AlertDialog` 替换为 `ConfirmDeleteDialog` |
| 迁移残留清理 | `apps/web/lib/data.ts` | 已删除（system 页面已迁移到真实 API） |
| 种子数据 | `packages/database/prisma/seed.ts` | 所有实体 ID 改为 UUID 格式，同步更新所有外键引用；重新执行 `pnpm db:seed` |

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

### 🔴 下一项大工程（方案A完成后启动）

0. **计算规则对齐** — 按计划 `docs/plans/2026-07-25-calculation-rules-alignment.md` 执行：schema 迁移（`Material.calcType/postAdmin`、`Quotation.shippingTerms`）+ `cost-calculator.ts` 重写（multiply/divide 系数、工价系数、管销价除法、内外销、利润 4 档）+ 文档 §10 两个完整示例黄金测试。

### 🟡 中优先级（代码整洁度与类型安全）

1. **拆分臃肿页面组件** (3小时)
   - `system/page.tsx` → 已部分拆分（ModelDictionaryConfig），可继续拆分剩余部分
   - `cost/new/page.tsx` → 拆分为步骤子组件

2. **完善类型安全** (4小时)
   - 替换 API 层的 `unknown[]` 为具体类型
   - 同步 `shared-types` 与 Prisma 类型
   - 修复 `apps/api/src/**/*.test.ts` 中的既有类型错误

### 🟢 低优先级（重构旧架构）

3. **将剩余旧路由重构为分层架构** (8小时)
   - 提取 Controller/Service/Repository
   - 统一错误处理和响应格式

### ✅ 已完成（2026-06-30）

- **标准包装类型复刻 + 包材关联原料 + 运费计算** (`ece8942`)：
  - 4 种标准包装类型、层级字段、自动计算 perBox/perCarton
  - `PackagingMaterial` 关联 `Material` 表，运行时读取名称/价格
  - `boxVolume`（CUFT）与 LCL/FCL 运费计算
  - 前端包装配置页、型号管理同步、`SearchableSelect` 组件
  - 后端测试 `136/136` 通过

### ✅ 已完成（2026-06-25 前后）

- **合并两套响应工具函数** (`e394b7c`)：统一使用 `lib/response-helpers.ts`，删除 `utils/http-response.ts`
- **为旧路由补充 Zod 验证** (`4da1e58`)：models/bom/regulations/standard-costs 等旧路由添加 schema 定义，替换 `request.body as` 类型断言
- **BOM 复制功能完整实现**：后端 copy API + 前端调用，已包含在 `ece8942` 中

### ✅ 已完成（2026-06-24）

- 产品系列/分类改为系统配置维护（Task 1）已提交 (`9298246`)
- 三项 Bug 修复方案确认并写入计划文件
- `docs/plans/2026-06-24-bug-fixes-plan.md` 已置于项目目录

### ✅ 已完成（2026-06-23）

- `createCrudApi` 列表返回类型与后端对齐
- `use-quotations` 正确返回分页 meta
- `use-users`/`use-system-config` 移除 `as unknown` 强转
- 用户删除关联检查与明确错误提示
- 统一删除确认弹窗组件并覆盖 8 个页面
- `apps/web/lib/data.ts` 迁移残留已删除
- 种子数据全部使用 UUID
- Phase 2 基线已提交（d763e6f）
- API 服务已重启并验证通过

### ✅ 已完成（2026-06-22）

- 资料模块（customers/materials/models/regulations/BOM）增删改接入真实 API
- 删除成功提示显示具体项目名称
- BOM 页面默认选中第一个型号时正确加载 BOM 数据

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

### 新增问题验证（2026-06-23 已完成）

- [x] **createCrudApi 类型** — `lib/api.ts` 默认列表类型为 `T[]`，与后端 `{ success, data: T[], meta }` 一致
- [x] **use-quotations meta** — 分页组件可获取真实 `meta.total`
- [x] **system 页面** — 访问 `/system` 加载真实 API 数据而非硬编码
- [x] **用户删除关联检查** — 删除 admin 返回 409，提示「客户 3M中国 等 10 条」
- [x] **无关联用户删除** — 新建测试用户后可正常删除
- [x] **统一删除弹窗** — 8 个页面的删除确认弹窗按钮样式一致（白底红字红边框 + Trash2 图标）
- [x] **种子数据 UUID** — 所有种子实体 ID 为 UUID 格式，API 路由 `uuidParamSchema` 验证通过

### 新增问题验证（2026-07-01 本次待 Lucas 审查）

- [ ] **前端 typecheck 清零** — `cd apps/web && npx tsc --noEmit` 无 `error TS`
- [ ] **前端测试通过** — `cd apps/web && pnpm test` 显示 `59 passed`
- [ ] **后端测试通过** — `cd apps/api && pnpm test` 显示 `136 passed`
- [ ] **新增成本分析流程** — 选择法规 → 选择型号 → 包装配置加载 → 下一步可点击
- [ ] **成本预览显示真实数字** — 不是 `¥undefined`
- [ ] **成本详情 / 成本对比 / 成本记录 / 审核列表** — 成本字段正常显示

### 浏览器最终验证步骤（Lucas）

1. 启动服务：`cd D:/Desktop/cost_demo_2 && pnpm dev`
2. 登录后访问 `/cost/new`，选择法规与型号，确认包装配置列表出现且下一步可点击
3. 访问 `/cost/records`，打开任一报价单详情，确认成本表格显示真实数字
4. 访问 `/cost/compare`，确认图表与表格成本数字正常
5. 访问 `/review/pending` 与 `/review/completed`，确认总成本列正常显示
6. 访问 `/notifications`，确认通知列表可加载且无类型报错

- [ ] **分层架构检查**：确认 `models.routes.ts`、`bom.routes.ts` 等7个路由是否已提取Controller/Service/Repository
- [ ] **Zod验证检查**：确认所有POST/PUT接口不再使用 `request.body as` 类型断言
- [ ] **角色权限检查**：敏感接口（如用户创建）是否返回403给非admin角色
- [ ] **数据恢复检查**：如需真实业务数据，重新运行迁移脚本后确认 quotations/customers 等记录恢复

---

## 备注

- 后端已正确连接 `cost_analysis_new`
- ✅ 前端14个页面查询已接入真实API
- ✅ `customers/materials/models/regulations/BOM` 增删改已接真实 API
- ✅ `system/page.tsx` 已迁移到真实 API，`lib/data.ts` 已删除
- ✅ 删除成功 toast 已显示具体项目名称
- ✅ 用户删除时后端检查关联业务数据并返回明确提示
- ✅ 删除确认弹窗已统一为 `ConfirmDeleteDialog` 组件（8 个页面）
- ✅ 种子数据已全部使用 UUID 格式
- ⚠️ **2026-06-23 重新 seed 后，此前迁移的真实业务数据（29 条 quotations 等）已被清空，如需恢复请重新运行迁移脚本**
- ✅ 端口配置已修复 (3003→3000)
- ✅ API 服务运行中 (`http://localhost:3000`)
- ✅ API 测试 `146/146` 通过（2026-08-19）
- ✅ 前端 typecheck **0 错误**
- ✅ 前端测试 **60/60** 通过（2026-08-19）
- ✅ Task 4 前端类型债修复已提交（`6e1dfc6`），原「待 commit 13 文件」清单已随其入库

### 最近修改（未提交，2026-07-01）

**Task 4: 前端类型债修复 + cost/new 运行时 bug 修复**:
- `packages/shared-types/src/index.ts` — 补全 `Quotation` 字段与 `PackagingConfig` 接口
- `packages/shared-types/src/api.ts` — `CreateQuotationRequest.customerId` 改为可选，新增 `customerName`
- `apps/web/app/(app)/cost/[id]/page.tsx` — `q.costs?.X` → `q.X`
- `apps/web/app/(app)/cost/compare/page.tsx` — `q!.costs?.X` → `q!.X`
- `apps/web/app/(app)/cost/new/page.tsx` — 修复 `getPackagingConfigs`/`calculate` 的 `.data` 多取一层问题；这是 Lucas 报告的选择型号后无包装配置、下一步禁用的根因
- `apps/web/app/(app)/cost/records/page.tsx` — 成本字段扁平化、`regulations?.map` 守卫
- `apps/web/app/(app)/review/pending/page.tsx` / `review/completed/page.tsx` — 成本字段扁平化
- `apps/web/app/(app)/notifications/page.tsx` — `materials?.find` 守卫
- `apps/web/app/(app)/master/processes/page.tsx` — 创建工序补充 `packagingConfigId`
- `apps/web/components/error-boundary.tsx` — `errorInfo.componentStack ?? undefined` 归一化
- `apps/web/hooks/api/use-bom.ts` — 新增 `BomMaterialItem` 接口，显式标注返回数据
- `apps/web/hooks/use-quotations.test.ts` — `act()` 包裹 mutation、修正 `toHaveBeenCalledWith` 断言

**质量指标**:
- 前端 typecheck: **0 错误**
- 前端测试: **59 passed**
- 后端测试: **136 passed**

**提交纪律**: 根据项目硬性要求，所有改动必须经 Lucas 在运行态审查通过后方可 commit。当前服务已启动，等待 Lucas 审查。

### 最近已提交修改（2026-06-30）

**commit `ece8942` — feat: 复刻旧系统标准包装类型与运费计算**：
- `packages/database/prisma/schema.prisma` — `PackagingConfig` 增加 `layer1/layer2/layer3`，`perBox` 改可空；`PackagingMaterial` 增加 `materialId`/`boxVolume`
- `packages/database/prisma/migrations/` — 3 个新迁移：包材关联原料、包装层级与材积、层级字段必填
- `packages/database/prisma/seed.ts` — 标准包装类型种子数据、LCL/FCL 系统配置初始化
- `packages/shared-types/src/packaging.ts` — 4 种标准类型、层级计算函数
- `packages/shared-types/src/index.ts` — `Model` 增加 `bomCount`/`packagingConfigCount`
- `apps/api/src/lib/schemas.ts` / `swagger-schemas.ts` — 同步新字段与枚举
- `apps/api/src/services/packaging.service.ts` — 自动计算 `perBox/perCarton`
- `apps/api/src/services/bom.service.ts` — BOM 复制服务
- `apps/api/src/repositories/packaging.repository.ts` — 支持新字段查询
- `apps/api/src/routes/bom.routes.ts` / `models.routes.ts` / `packaging.routes.ts` — BOM copy、型号计数聚合、包装配置路由
- `apps/api/src/utils/cost-calculator.ts` — LCL/FCL 运费计算
- `apps/api/src/utils/packaging.test.ts` / `cost-calculator.test.ts` / `services/bom.service.test.ts` / `services/packaging.service.test.ts` / `controllers/packaging.controller.test.ts` — 新增/更新测试
- `apps/web/components/searchable-select.tsx` — 新增可搜索下拉组件
- `apps/web/app/(app)/master/packaging/page.tsx` — 包装配置弹窗、包材管理、删除功能
- `apps/web/app/(app)/master/models/page.tsx` — BOM/包装配置真实计数、详情弹窗真实数据
- `apps/web/app/(app)/master/bom/page.tsx` / `processes/page.tsx` — 适配标准包装类型
- `apps/web/app/(app)/cost/new/page.tsx` — 报价页选择包装配置
- `apps/web/app/(app)/system/page.tsx` — LCL/FCL 参数维护
- `apps/web/hooks/api/use-bom.ts` / `use-packaging.ts` — 操作成功后刷新型号列表缓存
- `apps/web/lib/api.ts` / `constants.ts` / `types.ts` — API 类型与常量更新
- `apps/web/package.json` — 切换 webpack 模式
- `apps/web/stores/auth-store.ts` — 修复 Zustand hydration 警告

### 最近提交

```
commit 6579bde  (worktree 分支 fix/quote-save-and-auth，待合并 main)
@ fix(web): 成本记录页接入删除功能并本地化时间显示

commit e9833e7  (同上)
@ fix(api): 报价单支持按客户名称创建并补全响应 schema

commit a52e8ca  (同上)
@ fix(api): system-config 路由补充鉴权中间件

commit 6e1dfc6
@ fix(type-debt): 修复 Quotation 类型债务并同步测试

commit ece8942
@ feat: 复刻旧系统标准包装类型与运费计算

commit 9298246
@ feat(web): 产品系列与分类改为系统配置维护

commit 4da1e58
@ feat(api): 为旧路由补充 Zod 验证

commit e394b7c
@ refactor(api): 合并两套响应工具函数

commit d763e6f
@ docs: 更新 HANDOFF.md 与架构修复计划

commit 1ad0a2c
@ feat(api): 新增 system-config 后端 API 与前端 hook

commit 1d356f0
@ fix(tests): 同步测试用例并支持 201 响应状态码

commit 5f73472
@ fix(api): 修复 Phase 1 四项严重返修并接入角色权限

commit 86083d4
@ chore(db): 添加外键索引、sequence_numbers 表及级联删除
```

---

*交接完成。如有疑问，请查阅 `.memory/memory.md` 获取更详细的项目背景。*
