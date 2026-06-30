# 三项 Bug 修复实施计划

> **制定日期**: 2026-06-24
> **目标**: 修复 Lucas 指定的三个高优先级问题
> **总预估时间**: 约 3 小时

---

## 已确认方案

| 问题 | 方案 | 说明 |
|------|------|------|
| 1. 产品系列硬编码 | A | 系列 + 分类均改为 SystemConfig 维护 |
| 2. BOM 复制假成功 | B | 完整实现后端 copy API + 前端调用 |
| 3. 包材手动输入名称 | A | PackagingMaterial 完全关联 Material 表 |

---

## Task 1: 产品系列/分类改为系统配置维护

### 涉及文件

- `apps/web/app/(app)/system/page.tsx` — 新增系列/分类维护卡片
- `apps/web/app/(app)/master/models/page.tsx` — 移除硬编码，读取配置

### 实施步骤

1. **SystemConfig 数据结构**
   - key：`modelSeries` 和 `modelCategories`
   - 值类型：`string[]`，存入 `SystemConfig.value`（该字段为 Json 类型）
   - 默认值：`modelSeries = ['D系列', 'P系列', 'N系列', 'X系列']`，`modelCategories = ['半面罩', '口罩', '全面罩', '配件']`
   - ⚠️ 当前 `seed.ts` 中不存在这两个 key，首次保存时通过 upsert 新建两行 `system_config` 记录

2. **system/page.tsx**
   - 在「系统配置」Tab 新增「型号字典配置」卡片
   - 使用 `useState` 维护两个字符串数组
   - 提供「新增/删除」操作，保存时调用 `updateSystemConfig` 两次
   - 首次加载无配置时回退到默认值

3. **models/page.tsx**
   - 删除硬编码 `const categories = [...]` 和 `const series = [...]`
   - 使用 `useSystemConfig('modelSeries')` 和 `useSystemConfig('modelCategories')`
   - 读取失败或无数据时使用默认值
   - 过滤/表单中的下拉选项改为动态数组

### 验收标准

- [ ] system/page.tsx 可新增/删除系列和分类
- [ ] models/page.tsx 下拉选项与系统配置一致
- [ ] 删除后刷新页面，配置持久化
- [ ] 无配置时仍显示原有默认值

---

## Task 2: 完整实现 BOM 复制功能

### 涉及文件

- `packages/shared-types/src/api.ts` — 新增 `CopyBomRequest`
- `apps/api/src/services/bom.service.ts` — 新建复制服务
- `apps/api/src/routes/bom.routes.ts` — 新增 `POST /api/v1/bom/copy`
- `apps/web/lib/api.ts` — `bomApi.copy`
- `apps/web/hooks/api/use-bom.ts` — `useCopyBom` mutation
- `apps/web/app/(app)/master/bom/page.tsx` — 调用真实 API

### 实施步骤

1. **Shared Types**
   ```typescript
   export interface CopyBomRequest {
     sourceModelId: string
     targetModelId: string
   }
   ```

2. **Backend Service** (`apps/api/src/services/bom.service.ts`)
   - 查询 sourceModelId 的所有 BOM 物料
   - 删除 targetModelId 的现有 BOM 物料
   - 批量创建相同物料记录（新 sortOrder 从 1 开始）
   - 事务包裹保证原子性

3. **Backend Route** (`bom.routes.ts`)
   - 新增 `POST /api/v1/bom/copy`
   - Body 校验：sourceModelId、targetModelId 均为 UUID
   - 调用 service，返回 201

4. **Frontend API** (`lib/api.ts`)
   ```typescript
   copy: (data: CopyBomRequest): Promise<ApiResponse<unknown[]>> =>
     apiClient.post('/bom/copy', data),
   ```

5. **Frontend Hook** (`use-bom.ts`)
   - 新增 `copyMutation`
   - 成功后 invalid `['bom', targetModelId]` 和 `['bom']`

6. **Frontend Page** (`bom/page.tsx`)
   - `handleCopyBom` 调用 `copyBom.mutateAsync`
   - 成功后 `toast.success('BOM已复制')`
   - 失败时显示错误信息

### 验收标准

- [ ] 复制后目标型号 BOM 与源型号一致
- [ ] 复制前目标型号的旧 BOM 被清空
- [ ] 复制失败不显示成功提示
- [ ] API 单元测试覆盖 copy 路径

---

## Task 3: 包材关联原料并改为选择/搜索（方案 A）

### 已确认决策

- `materialId` 必填
- `name`、`price` 从 `Material` 运行时取，不在 `PackagingMaterial` 存储
- 开发阶段旧 `PackagingMaterial` 数据直接丢弃

### 涉及文件

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/`
- `packages/shared-types/src/api.ts`
- `apps/api/src/lib/schemas.ts`
- `apps/api/src/lib/swagger-schemas.ts`
- `apps/api/src/services/packaging.service.ts`
- `apps/api/src/repositories/packaging.repository.ts`
- `apps/api/src/controllers/packaging.controller.ts`
- `apps/api/src/services/packaging.service.test.ts`
- `apps/api/src/controllers/packaging.controller.test.ts`
- `apps/web/hooks/api/use-packaging.ts`
- `apps/web/app/(app)/master/packaging/page.tsx`

### 实施步骤

1. **数据库迁移**
   ```prisma
   model PackagingMaterial {
     id                String   @id @default(uuid())
     packagingConfigId String   @map("packaging_config_id")
     materialId        String   @map("material_id")
     quantity          Decimal  @db.Decimal(10, 4)
     boxLength         Decimal? @db.Decimal(10, 2) @map("box_length")
     boxWidth          Decimal? @db.Decimal(10, 2) @map("box_width")
     boxHeight         Decimal? @db.Decimal(10, 2) @map("box_height")
     createdAt         DateTime @default(now()) @map("created_at")
     updatedAt         DateTime @updatedAt @map("updated_at")

     packagingConfig   PackagingConfig @relation(fields: [packagingConfigId], references: [id], onDelete: Cascade)
     material          Material        @relation(fields: [materialId], references: [id], onDelete: Restrict)

     @@index([packagingConfigId])
     @@index([materialId])
     @@map("packaging_materials")
   }
   ```
   - `Material` 模型反向关系字段 `packagingMaterials PackagingMaterial[]`
   - 迁移脚本先 `TRUNCATE TABLE "packaging_materials"` 再改表结构

2. **Shared Types**
   ```typescript
   export interface CreatePackagingMaterialRequest {
     packagingConfigId: string
     materialId: string
     quantity: number
     boxLength?: number
     boxWidth?: number
     boxHeight?: number
   }

   export interface UpdatePackagingMaterialRequest {
     materialId?: string
     quantity?: number
     boxLength?: number
     boxWidth?: number
     boxHeight?: number
   }
   ```

3. **Backend Schema**
   ```typescript
   export const createPackagingMaterialSchema = z.object({
     materialId: z.string().uuid('物料ID格式不正确'),
     quantity: z.number().nonnegative('数量不能为负数'),
     boxLength: z.number().nonnegative('长度不能为负数').optional(),
     boxWidth: z.number().nonnegative('宽度不能为负数').optional(),
     boxHeight: z.number().nonnegative('高度不能为负数').optional(),
   })
   ```

4. **Backend Service / Repository / Controller**
   - Service DTO 移除 `name`/`price`，改为 `materialId`
   - Repository `findMaterials` 增加 `include: { material: true }`
   - Controller 校验 `materialId` 对应 `Material` 存在

5. **测试**
   - `packaging.service.test.ts`、`packaging.controller.test.ts` 测试数据改为 `materialId`

6. **Frontend**
   - `usePackagingMaterials` 加载 `materials` 列表
   - 包材页面表单移除 `name`/`price` 输入，改为原料 Select
   - 表格显示 `material.name`、`material.materialNo`、`material.unit`、`material.price`
   - 小计 = `material.price * quantity`

### 验收标准

- [ ] 数据库迁移成功执行
- [ ] 新增包材必须选择原料
- [ ] 价格从原料运行时取
- [ ] 列表展示原料料号与单位
- [ ] API 测试 114/114 通过

---

## 执行顺序

1. Task 1（无后端改动，风险最低）
2. Task 3（含数据库迁移，优先处理 schema 变更）
3. Task 2（依赖 Task 1/3 完成后验证环境稳定）

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm test` 通过
- [ ] 数据库迁移可回滚
- [ ] 手动验证三个功能均正常

## 提交计划

1. `feat(web): 产品系列与分类改为系统配置维护`
2. `feat(db/api/web): 包材关联原料并支持选择`
3. `feat(api/web): 完整实现 BOM 复制功能`

> 所有提交需经 Lucas 验证后方可执行。
