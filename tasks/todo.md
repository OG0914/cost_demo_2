# 任务清单

## 进行中 🚧

### Task-15: 方案A缺陷修复收尾——运行态审查与合并 main
- **状态**: 已收尾（已推送 main `27ec71a`，只剩 Lucas 浏览器复核）——2026-11-23 Lucas 明确表示稍后自己找时间确认，**其余人不得代勾该验收项**
- **负责人**: Claude
- **描述**: 4 个缺陷已在 worktree 分支 `fix/quote-save-and-auth` 修复并拆为 3 个 commit（a52e8ca / e9833e7 / 6579bde）。2026-11-23 完成合并、清理与推送。
- **验收标准**:
  - [x] 后端测试 146/146 通过（+10 新增）
  - [x] 前端测试 60/60 通过（+1 新增）
  - [x] typecheck 6/6、lint 4/4 全绿
  - [x] 运行态实证：records 页有数据、customerName 创建成功（QT-2026-0007 + 自动建档 CUST-2026-0001，测试数据已清理）
  - [ ] Lucas 浏览器复核：删除确认弹窗可删、时间列显示北京时间
  - [x] 合并 fix/quote-save-and-auth 回 main，清理 worktree（2026-11-23）
  - [x] 已推送 origin/main（2026-11-23，`ece8942..27ec71a`）

---

## 已完成 ✅

### Task-17: 删除被引用数据时不再返回无语义的 400
- **完成时间**: 2026-11-23
- **背景**: 运行态复核时发现原料页删除全部失败，控制台两条 toast：「数据关联错误，请先删除关联数据」+「外键约束失败」，HTTP 400。根源是删除父记录时只有数据库外键在拦，错误处理器把 Prisma P2003 一律映射成 400 + 原始文案。
- **处理**:
  - `material.service.delete()` 增加引用审计：包装配置（Restrict）、BOM（Cascade，静默删会丢成本结构）、价格变更通知（Restrict），命中就招 409 并列出具体引用数/名称
  - `error-handler` 新增反向映射：任何 `DELETE` 撞上 P2003/P2014 → 409 `RESOURCE_CONFLICT`，按约束名（`meta.constraint`）给出可操作提示；非 DELETE 仍为 400（引用的关联数据不存在）
  - 约束名→提示对应表取自数据库 `pg_constraint` 实际值（11 条 Restrict 关系）
- **验证**: 后端 152/152（+5）、前端 60/60、两端 `tsc --noEmit` 0 错；运行态实测：删耳带→409「1 个包装配置（N-95 泡壳直装）、1 条 BOM」，删被型号引用的法规→409「该法规仍被型号引用」，新建→改价→删除无引用原料均 200
- **经验**: 见 `tasks/lessons.md` L006

### Task-16: 反向改动收尾、全量鉴权门禁与仓库清理
- **完成时间**: 2026-11-23
- **背景**: main 暂存区存在一批**反向补丁**，把 Task-14 的修复整体回退——system-config 三端点摘掉 `authenticate`、`use-filters` 去掉空搜索放行、删除 3 个测试文件。测试数从 146/60 掉到 136/59，但 `pnpm test` 全绿。
- **处理**:
  - 原改动存入 `stash@{0}`（`git stash show -p stash@{0}` 复查），工作区回到 `a111172`
  - 运行态验证：无 token `GET/PUT /api/v1/system-configs` 由 200 变 401，带 token 仍 200
  - 新增 `apps/api/src/routes/auth-guard.sweep.test.ts`：枚举 `/api/v1` 下全部已注册路由，逐条断言无 token 必须 401（仅 `POST /auth/login` 白名单），并校验路由数 ≥ 40 防假绿（提交 `27ec71a`）
  - `git worktree prune` 清掉 7 条指向已删除 `D:/Desktop/cost_demo_2` 的元数据；删除 1.6G 残留目录（`.worktrees/` 1.1G + `.claude/worktrees/` 509M）；删除 7 个已并入 main 的分支
  - 仅存于残留目录的 4 个文件（`searchable-select.tsx`、2 份 2026-06-26 包装计划、1 个被 `20260629` 迁移取代的旧迁移）存至 `D:/1Work/project/_salvage-20261123/`
  - 修复 node_modules 全部断链（链接指向已删除的 `D:/Desktop/cost_demo_2`）：`pnpm install --frozen-lockfile` 15s 完成
  - 14 个滞留 commit 一并推送：`ece8942..27ec71a`
- **验证**: 后端 147/147、前端 60/60、两端 `tsc --noEmit` 0 错；门禁先失败后通过已实证（临时摘掉 `authenticate` 时准确报出 3 条路由）
- **经验**: 见 `tasks/lessons.md` L004 / L005

### Task-14: 方案A——4 个遗留缺陷修复
- **完成时间**: 2026-08-19（代码与测试完成，待运行态终审后合并）
- **分支**: `.worktrees/fix-quote-save` worktree，分支 `fix/quote-save-and-auth`
- **备注**: 11 个文件（+396/-11），拆 3 个 commit：
  - `a52e8ca` fix(api): system-config 路由补充鉴权中间件（P0 安全缺口，3 端点裸奔）
  - `e9833e7` fix(api): 报价单支持按客户名称创建并补全响应 schema（customerId/customerName 二选一 + 自动建档；quotationSchema 补全被裁字段——成本记录页空白真凶）
  - `6579bde` fix(web): 成本记录页接入删除功能并本地化时间显示（删除死按钮接 ConfirmDeleteDialog；createdAt 改用 formatDateTime；useListFilters 空搜索放行）
- **经验**: Fastify 挂响应 schema 后未声明的键会被裁掉，单测抓不到，必须路由级 inject 测试；Zod 与路由 JSON Schema 双份定义改一处必须同步另一处。

### Task-13: 运行态审查与进度核实
- **完成时间**: 2026-08-19
- **备注**: HANDOFF 声称已逐条实测核验（后端 136→146、前端 59→60）。「成本记录 0 条」已根因定位并修复——真凶是 Fastify 响应 schema 裁剪 quotationNo/关联对象 + useListFilters 误过滤，非 React Query 缓存（旧误判已更正记忆）。报价单高价计算逻辑待计算规则对齐计划统一处理。

### Task-9: [计划 Task 2] 完整实现 BOM 复制功能
- **完成时间**: 2026-06-29
- **备注**: 已修复 `bom/page.tsx` 中 `handleCopyBom` 语法错误，补全 `useBom` hook 对 `copy` mutation 的导出与 `CopyBomRequest` 导入，前端复制弹窗已调用真实 `POST /api/v1/bom/copy` API。后端 copy 端点与 service 测试已存在。

### Task-0: 修复用户列表恒为 0 的 bug
- **完成时间**: 2026-06-23
- **备注**: 已修复 `use-users.ts` 列表解析，API 实测返回 11 个用户。

### Task-1: 修复 createCrudApi 列表返回类型
- **完成时间**: 2026-06-23
- **备注**: 将 `apps/web/lib/api.ts` 中 createCrudApi 默认 ListType 从 `ListResponse<T>` 改为 `T[]`，同步修复 `systemConfigApi` 类型，移除 `use-users.ts` 和 `use-system-config.ts` 中的 `as unknown` 强转。

### Task-2: 修复报价单分页 meta
- **完成时间**: 2026-06-23
- **备注**: `useQuotations` 现在正确返回 `response.meta`，不再硬编码 `meta: undefined`。

### Task-3: 验证 system 弹窗关闭时机
- **完成时间**: 2026-06-23
- **备注**: 经复核，`system/page.tsx` 中 `handleSaveUser` 的 try/catch 逻辑正确：409 等错误会进入 catch，弹窗不会关闭。无需修改。

### Task-4: 清理技术债
- **完成时间**: 2026-06-23
- **备注**: 删除迁移残留文件 `apps/web/lib/data.ts`，确认无人引用。

### Task-5: 实现用户删除关联检查
- **完成时间**: 2026-06-23
- **备注**: 在 `apps/api/src/services/user.service.ts` 中实现删除前关联检查。若用户有报价单/客户/标准成本/通知等关联数据，返回 409 冲突错误，消息中提示第一条关联数据及总数。

### Task-6: 创建统一删除确认组件
- **完成时间**: 2026-06-23
- **备注**: 新建 `apps/web/components/confirm-delete-dialog.tsx`，统一为白底红字边框样式，带 Trash2 图标。

### Task-7: 替换所有页面删除弹窗
- **完成时间**: 2026-06-23
- **备注**: 已将 system、regulations、materials、models、customers、bom、packaging、processes 共 8 个页面的删除确认弹窗替换为统一组件。

### Task-8: [计划 Task 3] 包材关联原料并改为选择/搜索
- **完成时间**: 2026-06-30
- **备注**: 已合并到 main。核心改动随提交 `ece8942 feat: 复刻旧系统标准包装类型与运费计算` 进入 main，包括 4 种标准包装类型、layer1/2/3 层级、boxVolume（CUFT）运费计算、可搜索下拉组件、包装配置弹窗等。`stash@{0}` 与 `.claude/worktrees/task3-packaging-material/` 已过期，仅保留部分未进入 main 的实验性文件，后续清理。

### Task-10: [计划 Task 1] 产品系列/分类改为系统配置维护
- **完成时间**: 2026-06-24
- **备注**: 已提交。`system/page.tsx` 新增型号字典配置卡片，`models/page.tsx` 移除硬编码并读取 `modelSeries`/`modelCategories` 配置。

### Task-11: 合并两套响应工具函数
- **完成时间**: 2026-06-25 前后
- **备注**: 已提交 `e394b7c refactor(api): 合并两套响应工具函数`。统一使用 `lib/response-helpers.ts`，删除 `utils/http-response.ts`。

### Task-12: 为旧路由补充 Zod 验证
- **完成时间**: 2026-06-25 前后
- **备注**: 已提交 `4da1e58 feat(api): 为旧路由补充 Zod 验证`。为旧架构路由添加 schema 定义并替换 `request.body as` 类型断言。

---

## 遗留问题

- **删除失败提示重复 toast**：`lib/api.ts` 拦截器与各 hook 的 `onError` 各弹一次，同一错误会出现两条提示。共 39 处 `toast.error(error.message...)` 分布在 11 个 hook，应先统一成单一 toast 出口（或给 sonner 传固定 `id`）再改，属于独立重构。
- **「提交审核」死按钮**：成本记录列表页该菜单项无 onClick（`records/page.tsx`），草稿单目前需从详情页提交。已与 Lucas 确认暂缓。审核流转本身无需预设审核人（submit 仅置 status=submitted，进 /review/pending 待审核池，reviewer/admin 角色处理时记录 reviewedBy）。
- **计算规则对齐计划**（`docs/plans/2026-07-25-calculation-rules-alignment.md`）：方案A 完成后的下一项大工程，含 schema 迁移（Material.calcType/postAdmin、Quotation.shippingTerms）+ 计算引擎重写 + 黄金测试。
- **旧报价单外销 VAT 数据不一致**：历史数据可能存在 saleType=export 但 vat>0，优先判定为旧数据问题。
- `.agents/` 与 `AGENTS.md` 已加入 `.gitignore`：AGENTS.md 是 CLAUDE.md 的派生副本，只保留 CLAUDE.md 作为权威源，避免两份规则各自漂移。
- `.claude/settings.local.json` 已停止跟踪（`git rm --cached`），本机文件保留；权限历史不再进仓库。
- 主检出已从 `D:/Desktop/cost_demo_2` 迁移到 `D:/1Work/project/cost_demo_2`，旧路径已不存在；残留 worktree 与断链依赖已于 2026-11-23 清理完毕。
