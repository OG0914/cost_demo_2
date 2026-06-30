# Task 3 实施计划：包材关联原料并改为选择/搜索

> **制定日期**: 2026-06-25
> **目标**: 将 `PackagingMaterial` 从独立维护名称/价格，改为关联 `Material` 表，价格运行时取自原料
> **总预估时间**: 约 3.5 小时（含测试）
> **风险等级**: 高（涉及数据库 schema 变更、数据丢失、成本计算链路）

---

## 一、现状分析

### 1.1 当前问题

前端 `apps/web/app/(app)/master/packaging/page.tsx` 的包材表单仍手动输入 `name` 和 `price`：

```tsx
// page.tsx:379-404
<Label>包材名称</Label>
<Input value={formData.name} ... />
<Label>单价</Label>
<Input type="number" value={formData.price} ... />
```

表格也直接显示 `item.name` 和 `item.price`：

```tsx
// page.tsx:303-312
<TableCell>{item.name}</TableCell>
<TableCell className="text-right">¥{item.price.toFixed(2)}</TableCell>
<TableCell className="text-right font-medium">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
```

### 1.2 当前数据模型

`packages/database/prisma/schema.prisma:206-223`：

```prisma
model PackagingMaterial {
  id                 String   @id @default(uuid())
  packagingConfigId  String   @map("packaging_config_id")
  name               String
  quantity           Decimal  @db.Decimal(10, 4)
  price              Decimal  @db.Decimal(10, 4)
  boxLength          Decimal? @db.Decimal(10, 2) @map("box_length")
  boxWidth           Decimal? @db.Decimal(10, 2) @map("box_width")
  boxHeight          Decimal? @db.Decimal(10, 2) @map("box_height")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  packagingConfig    PackagingConfig @relation(fields: [packagingConfigId], references: [id], onDelete: Cascade)

  @@index([packagingConfigId])
  @@map("packaging_materials")
}
```

### 1.3 当前成本计算链路

`apps/api/src/utils/cost-calculator.ts:48-71` 直接读取 `packagingMaterials.price`：

```typescript
async function getPackagingConfig(packagingConfigId: string) {
  return prisma.packagingConfig.findUnique({
    where: { id: packagingConfigId },
    include: {
      processConfigs: true,
      packagingMaterials: true,
    },
  })
}

function calculatePackagingCost(
  packagingMaterials: PackagingMaterialItem[],
  quantity: number
): number {
  return packagingMaterials.reduce(
    (sum, pm) => sum + Number(pm.price) * Number(pm.quantity) * quantity,
    0
  )
}
```

**这是本次改动最关键的下游影响点。若 schema 移除 `price` 后此处未同步修改，报价单计算将立即失效。**

---

## 二、方案决策

| 决策项 | 结论 | 说明 |
|--------|------|------|
| `materialId` | 必填 | 每个包材必须对应一个原料 |
| `name`/`price` | 从 `PackagingMaterial` 移除 | 运行时从 `Material` 表读取 |
| 旧数据 | 丢弃 | 迁移脚本先 `TRUNCATE` 再改结构 |
| `boxLength`/`boxWidth`/`boxHeight` | 保留 | 仅外箱材积计算使用 |
| `Material` 反向关系 | 新增 | `packagingMaterials PackagingMaterial[]` |

---

## 三、实施步骤

### 步骤 1：数据库 Schema 与迁移

#### 3.1.1 修改 `packages/database/prisma/schema.prisma`

`PackagingMaterial` 模型改为：

```prisma
model PackagingMaterial {
  id                 String   @id @default(uuid())
  packagingConfigId  String   @map("packaging_config_id")
  materialId         String   @map("material_id")
  quantity           Decimal  @db.Decimal(10, 4)
  boxLength          Decimal? @db.Decimal(10, 2) @map("box_length")
  boxWidth           Decimal? @db.Decimal(10, 2) @map("box_width")
  boxHeight          Decimal? @db.Decimal(10, 2) @map("box_height")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  packagingConfig    PackagingConfig @relation(fields: [packagingConfigId], references: [id], onDelete: Cascade)
  material           Material        @relation(fields: [materialId], references: [id], onDelete: Restrict)

  @@index([packagingConfigId])
  @@index([materialId])
  @@map("packaging_materials")
}
```

在 `Material` 模型新增反向关系字段：

```prisma
model Material {
  // ... 现有字段
  packagingMaterials PackagingMaterial[]
}
```

#### 3.1.2 创建迁移脚本

执行：

```bash
pnpm db:migrate --name packaging_material_link_material
```

生成的迁移脚本必须包含：

```sql
-- 先清空旧数据，因为旧数据没有 materialId 且 name/price 结构与目标不一致
TRUNCATE TABLE "packaging_materials";

-- 删除旧字段
ALTER TABLE "packaging_materials" DROP COLUMN "name";
ALTER TABLE "packaging_materials" DROP COLUMN "price";

-- 新增 material_id
ALTER TABLE "packaging_materials" ADD COLUMN "material_id" TEXT NOT NULL;

-- 添加外键与索引
ALTER TABLE "packaging_materials" ADD CONSTRAINT ... FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;
CREATE INDEX ... ON "packaging_materials"("material_id");
```

> ⚠️ 注意：迁移执行前需确认 `packaging_materials` 表中无生产数据，或已备份。

#### 3.1.3 重新生成 Prisma Client

```bash
pnpm db:generate
```

---

### 步骤 2：共享类型更新

#### 3.2.1 修改 `packages/shared-types/src/api.ts`

将：

```typescript
export interface CreatePackagingMaterialRequest {
  packagingConfigId: string
  name: string
  quantity: number
  price: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
}

export interface UpdatePackagingMaterialRequest {
  name?: string
  quantity?: number
  price?: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
}
```

改为：

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

---

### 步骤 3：后端 Schema 更新

#### 3.3.1 Zod Schema（`apps/api/src/lib/schemas.ts:204-216`）

改为：

```typescript
export const createPackagingMaterialSchema = z.object({
  materialId: z.string().uuid('物料ID格式不正确'),
  quantity: z.number().nonnegative('数量不能为负数'),
  boxLength: z.number().nonnegative('长度不能为负数').optional(),
  boxWidth: z.number().nonnegative('宽度不能为负数').optional(),
  boxHeight: z.number().nonnegative('高度不能为负数').optional(),
})

export const updatePackagingMaterialSchema = createPackagingMaterialSchema.partial()
```

#### 3.3.2 Swagger Schema（`apps/api/src/lib/swagger-schemas.ts`）

新增/修改：

```typescript
export const packagingMaterialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    materialId: { type: 'string', format: 'uuid', description: '原料ID' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    boxLength: { type: 'number', nullable: true, description: '箱子长度' },
    boxWidth: { type: 'number', nullable: true, description: '箱子宽度' },
    boxHeight: { type: 'number', nullable: true, description: '箱子高度' },
    material: materialSchema,
  },
} as const

export const createPackagingMaterialRequestSchema = {
  type: 'object',
  required: ['materialId', 'quantity'],
  properties: {
    materialId: { type: 'string', format: 'uuid', description: '原料ID' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    boxLength: { type: 'number', description: '箱子长度' },
    boxWidth: { type: 'number', description: '箱子宽度' },
    boxHeight: { type: 'number', description: '箱子高度' },
  },
} as const

export const updatePackagingMaterialRequestSchema = {
  type: 'object',
  properties: {
    materialId: { type: 'string', format: 'uuid', description: '原料ID' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    boxLength: { type: 'number', description: '箱子长度' },
    boxWidth: { type: 'number', description: '箱子宽度' },
    boxHeight: { type: 'number', description: '箱子高度' },
  },
} as const
```

同时更新 `packagingConfigSchema` 以包含包材列表：

```typescript
export const packagingConfigSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', description: '配置名称' },
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    description: { type: 'string', nullable: true, description: '描述' },
    model: modelSchema,
    packagingMaterials: {
      type: 'array',
      items: packagingMaterialSchema,
    },
  },
} as const
```

#### 3.3.3 Route Swagger（`apps/api/src/routes/packaging.routes.ts:74-127`）

`packagingMaterialSchema` / `createPackagingMaterialRequestSchema` / `updatePackagingMaterialRequestSchema` 跟随 `swagger-schemas.ts` 的改动同步更新。由于 route 文件是引用外部 schema，主要修改在 `swagger-schemas.ts`。

---

### 步骤 4：后端 Repository 更新

#### 3.4.1 修改 `apps/api/src/repositories/packaging.repository.ts`

将 `packagingConfigInclude` 改为嵌套 include：

```typescript
private readonly packagingConfigInclude = {
  model: true,
  processConfigs: {
    orderBy: { sortOrder: 'asc' } as const,
  },
  packagingMaterials: {
    include: { material: true },
  },
} as const
```

将 `findMaterials` 改为：

```typescript
async findMaterials(packagingConfigId: string) {
  return prisma.packagingMaterial.findMany({
    where: { packagingConfigId },
    include: { material: true },
  })
}
```

---

### 步骤 5：后端 Service 更新

#### 3.5.1 修改 `apps/api/src/services/packaging.service.ts`

接口定义改为：

```typescript
export interface CreatePackagingMaterialInput {
  packagingConfigId: string
  materialId: string
  quantity: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
}

export interface UpdatePackagingMaterialInput {
  materialId?: string
  quantity?: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
}
```

`createMaterial` 改为校验 `materialId` 存在并写入关联：

```typescript
async createMaterial(input: CreatePackagingMaterialInput) {
  const config = await this.repository.findById(input.packagingConfigId)
  if (!config) {
    throw new Error('INVALID_CONFIG')
  }

  const material = await this.prisma.material.findUnique({
    where: { id: input.materialId },
  })
  if (!material) {
    throw new Error('INVALID_MATERIAL')
  }

  return this.repository.createMaterial({
    packagingConfig: { connect: { id: input.packagingConfigId } },
    material: { connect: { id: input.materialId } },
    quantity: input.quantity,
    boxLength: input.boxLength,
    boxWidth: input.boxWidth,
    boxHeight: input.boxHeight,
  })
}
```

`updateMaterial` 同步改为 `materialId` + 数量 + 材积。

---

### 步骤 6：后端 Controller 更新

#### 3.6.1 修改 `apps/api/src/controllers/packaging.controller.ts`

`createMaterial` 和 `updateMaterial` 的 body 字段映射从 `name`/`price` 改为 `materialId`。同时处理 `INVALID_MATERIAL` 错误：

```typescript
catch (error) {
  if (error instanceof Error) {
    if (error.message === 'INVALID_CONFIG') {
      return sendError(reply, 400, 'INVALID_CONFIG', '包装配置不存在')
    }
    if (error.message === 'INVALID_MATERIAL') {
      return sendError(reply, 400, 'INVALID_MATERIAL', '原料不存在')
    }
  }
  throw error
}
```

---

### 步骤 7：成本计算更新（关键）

#### 3.7.1 修改 `apps/api/src/utils/cost-calculator.ts`

`getPackagingConfig` 改为嵌套 include：

```typescript
async function getPackagingConfig(packagingConfigId: string) {
  return prisma.packagingConfig.findUnique({
    where: { id: packagingConfigId },
    include: {
      processConfigs: true,
      packagingMaterials: {
        include: { material: true },
      },
    },
  })
}
```

`PackagingMaterialItem` 与 `calculatePackagingCost` 改为从 `material.price` 读取：

```typescript
interface PackagingMaterialItem {
  material: {
    price: number | string | { toNumber(): number }
  }
  quantity: number | string | { toNumber(): number }
}

function calculatePackagingCost(
  packagingMaterials: PackagingMaterialItem[],
  quantity: number
): number {
  return packagingMaterials.reduce(
    (sum, pm) => sum + Number(pm.material.price) * Number(pm.quantity) * quantity,
    0
  )
}
```

---

### 步骤 8：测试更新

#### 3.8.1 后端测试

修改以下测试文件中的 mock/输入数据：

- `apps/api/src/services/packaging.service.test.ts`
- `apps/api/src/controllers/packaging.controller.test.ts`

所有 `name`/`price` 改为 `materialId`，并补充 `material` 的 mock 数据。

新增测试用例：

- `createMaterial` 传入不存在 `materialId` 返回 400
- `createMaterial` 传入不存在 `packagingConfigId` 返回 400
- 更新后 `getById` 返回的包材列表包含 `material.name` / `material.price`

#### 3.8.2 成本计算测试

检查是否有 `cost-calculator.ts` 的测试文件。如有，更新 `packagingMaterials` 数据结构为嵌套 `material` 对象。

---

### 步骤 9：前端更新

#### 3.9.1 修改 `apps/web/app/(app)/master/packaging/page.tsx`

**本地类型更新**：

```typescript
interface PackagingMaterial {
  id: string
  materialId: string
  quantity: number
  material: {
    id: string
    name: string
    materialNo: string
    unit: string
    price: number
  }
  boxVolume?: {
    length: number
    width: number
    height: number
  }
}
```

**表单状态更新**：

```typescript
const [formData, setFormData] = useState({
  materialId: '',
  quantity: '',
  boxLength: '',
  boxWidth: '',
  boxHeight: '',
})
```

**包材名称/单价输入改为原料 Select**：

```tsx
<div className="space-y-2">
  <Label>原料</Label>
  <Select
    value={formData.materialId}
    onValueChange={(value) => setFormData({ ...formData, materialId: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="选择原料" />
    </SelectTrigger>
    <SelectContent>
      {materials.map((m) => (
        <SelectItem key={m.id} value={m.id}>
          {m.materialNo} - {m.name}（¥{m.price.toFixed(2)}/{m.unit}）
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

需要加载原料列表：

```typescript
import { useMaterials } from '@/hooks/api'

const { materials } = useMaterials()
```

**表格列更新**：

```tsx
<TableHead>原料料号</TableHead>
<TableHead>原料名称</TableHead>
<TableHead>单位</TableHead>
<TableHead className="text-right">用量</TableHead>
<TableHead className="text-right">单价</TableHead>
<TableHead className="text-right">小计</TableHead>
<TableHead>外箱材积</TableHead>
<TableHead className="w-[80px]">操作</TableHead>
```

行内显示：

```tsx
<TableCell>{item.material.materialNo}</TableCell>
<TableCell className="font-medium">{item.material.name}</TableCell>
<TableCell>{item.material.unit}</TableCell>
<TableCell className="text-right">{item.quantity}</TableCell>
<TableCell className="text-right">¥{item.material.price.toFixed(2)}</TableCell>
<TableCell className="text-right font-medium">
  ¥{(item.material.price * item.quantity).toFixed(2)}
</TableCell>
```

**删除确认文案更新**：

```tsx
<ConfirmDeleteDialog
  description={`确定要删除原料 "${editingItem?.material.name}" 吗？此操作不可撤销。`}
/>
```

#### 3.9.2 修改 `apps/web/hooks/api/use-packaging.ts`

`usePackagingMaterials` 内部可保持调用 `packagingApi.getMaterials`，因为返回类型已变为包含 `material` 嵌套对象。类型系统会跟随 `shared-types` 和 API 响应自动更新。

#### 3.9.3 修改 `apps/web/lib/api.ts`（可选）

当前 `packagingApi.createMaterial` / `updateMaterial` 使用 `CreatePackagingMaterialRequest` / `UpdatePackagingMaterialRequest`，这两个类型在 `shared-types` 中已更新，因此 `api.ts` 通常无需额外改动。若 Swagger 生成的类型与前端不一致，再针对性调整。

---

## 四、迁移脚本示例

创建 `packages/database/prisma/migrations/20260625xxxxxx_packaging_material_link_material/migration.sql`：

```sql
-- 清空旧包材数据（旧结构 name/price 无法映射到新结构）
TRUNCATE TABLE "packaging_materials";

-- 删除旧字段
ALTER TABLE "packaging_materials" DROP COLUMN "name";
ALTER TABLE "packaging_materials" DROP COLUMN "price";

-- 新增 material_id
ALTER TABLE "packaging_materials" ADD COLUMN "material_id" TEXT NOT NULL;

-- 添加外键约束
ALTER TABLE "packaging_materials" ADD CONSTRAINT "packaging_materials_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 添加索引
CREATE INDEX "packaging_materials_material_id_idx" ON "packaging_materials"("material_id");
```

---

## 五、执行顺序

```
1. 备份数据库（如有生产数据）
2. 修改 schema.prisma
3. 创建并审核迁移脚本（含 TRUNCATE）
4. 执行 pnpm db:migrate + pnpm db:generate
5. 更新 shared-types
6. 更新后端 schemas / swagger-schemas / routes
7. 更新 repository / service / controller
8. 更新 cost-calculator.ts
9. 更新后端测试
10. 更新前端 page.tsx / hook
11. pnpm typecheck
12. pnpm test（API 测试 114+/114+ 通过）
13. 浏览器端到端验证
```

---

## 六、风险与回滚

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `TRUNCATE` 丢失现有包材数据 | 高 | 迁移前确认无生产数据；如需保留，先导出 |
| `cost-calculator.ts` 未同步导致报价单计算失败 | 极高 | 纳入验收标准，必须跑通报价单计算测试 |
| 前端类型与后端返回不一致 | 中 | 跑 `pnpm typecheck` 和端到端验证 |
| 外键 `Restrict` 导致删除原料失败 | 中 | 符合业务预期，删除原料前需先解除包材关联 |
| swagger 文档与接口不一致 | 中 | 同步更新 swagger-schemas.ts 和 route 引用 |

**回滚方案**：

- 数据库：通过 `prisma migrate resolve --rolled-back` 或手动恢复备份
- 代码：git revert 本次提交

---

## 七、验收标准

- [ ] `pnpm db:migrate` 成功执行，无错误
- [ ] `packages/database/prisma/schema.prisma` 中 `PackagingMaterial` 含 `materialId`，无 `name`/`price`
- [ ] `apps/api/src/utils/cost-calculator.ts` 从 `pm.material.price` 读取价格
- [ ] `apps/api/src/repositories/packaging.repository.ts` 的 `packagingConfigInclude` 嵌套 include `material`
- [ ] 新增包材必须选择原料，无法手动输入名称/价格
- [ ] 包材列表展示原料料号、名称、单位、单价
- [ ] 小计 = 原料单价 × 用量
- [ ] 报价单计算接口可正确返回 packagingCost
- [ ] API 测试全部通过（目标 114+/114+）
- [ ] `pnpm typecheck` 通过
- [ ] 浏览器端到端验证通过

---

## 八、提交计划

建议拆分为 1 个 commit（改动耦合度高，不宜拆分）：

```text
feat(db/api/web): 包材关联原料并支持选择

- PackagingMaterial 新增必填 materialId，移除 name/price
- 价格运行时从 Material 表读取
- 前端包材表单改为原料 Select
- 同步更新成本计算、swagger、测试

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 九、前置依赖

- Task 1 已提交（✅ 已完成，commit 9298246）
- Lucas 明确批准本计划及 `TRUNCATE` 风险
- 数据库当前无需要保留的包材生产数据
