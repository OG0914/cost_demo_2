# 方案B: System 配置完整实现计划

## 背景

当前 `apps/web/app/(app)/system/page.tsx` 仅实现6个字段的硬编码，需升级为完整的系统配置模块（30+字段）。

---

## 完整配置清单

根据 `docs/summary/system-config.md` 和 `docs/summary/calculation-rules.md`：

| 配置卡片 | 字段明细 |
|---------|----------|
| **基础费率** | 管销率(20%)、增值税率(13%)、保险率(0.3%)、增值税率选项列表 |
| **汇率与系数** | 汇率CNY/USD(7.2)、工价系数(1.56)、FOB深圳汇率(7.1) |
| **CIF深圳运费** | 海运费(10USD/CBM)、CFS费用(60CNY)、文件费(500CNY)、报关费(400CNY)、仓库费(130CNY)、湖北知腾卡车(400CNY/CBM) |
| **整柜运费FCL** | 20尺整柜(840USD)、40尺整柜(940USD) |
| **散货运费LCL** | 基础运费1-3CBM(900CNY)、3-5CBM(1000CNY)、5-8CBM(1100CNY)、8-10CBM(1200CNY)、10-12CBM(1300CNY)、12-15CBM(1400CNY)、操作费Handling(500CNY)、拼箱费CFS/CBM(170CNY)、文件费(500CNY) |
| **利润档位** | [5%, 10%, 25%, 50%] 可配置 |
| **计算规则** | 5种计算类型 × 原料/包材 × 公式/系数 = 20个配置点 |
| **原料类别** | 类别名称、排序 |

---

## 一、数据库 Schema 设计

```prisma
// 1. 基础费率配置
model BaseRateConfig {
  id              String   @id @default(uuid())
  adminFeeRate    Decimal  @db.Decimal(5, 4)
  vatRate         Decimal  @db.Decimal(5, 4)
  insuranceRate   Decimal  @db.Decimal(5, 4)
  vatRateOptions  Json
  updatedAt       DateTime @updatedAt
  updatedBy       String?
}

// 2. 汇率与系数配置
model ExchangeConfig {
  id               String   @id @default(uuid())
  exchangeRate     Decimal  @db.Decimal(10, 4)
  laborCoefficient Decimal  @db.Decimal(5, 2)
  fobShenzhenRate  Decimal  @db.Decimal(10, 4)
  updatedAt        DateTime @updatedAt
  updatedBy        String?
}

// 3. CIF运费配置
model CifShippingConfig {
  id           String   @id @default(uuid())
  oceanFreight Decimal  @db.Decimal(10, 2)
  cfsFee       Decimal  @db.Decimal(10, 2)
  documentFee  Decimal  @db.Decimal(10, 2)
  customsFee   Decimal  @db.Decimal(10, 2)
  warehouseFee Decimal  @db.Decimal(10, 2)
  truckingFee  Decimal  @db.Decimal(10, 2)
  updatedAt    DateTime @updatedAt
  updatedBy    String?
}

// 4. 整柜运费配置
model FclShippingConfig {
  id        String   @id @default(uuid())
  fcl20Rate Decimal  @db.Decimal(10, 2)
  fcl40Rate Decimal  @db.Decimal(10, 2)
  updatedAt DateTime @updatedAt
  updatedBy String?
}

// 5. 散货运费配置
model LclShippingConfig {
  id          String   @id @default(uuid())
  minCbm      Int
  maxCbm      Int
  baseRate    Decimal  @db.Decimal(10, 2)
  handlingFee Decimal  @db.Decimal(10, 2)
  cfsFee      Decimal  @db.Decimal(10, 2)
  documentFee Decimal  @db.Decimal(10, 2)
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

// 6. 利润档位配置
model ProfitTierConfig {
  id        String   @id @default(uuid())
  rate      Decimal  @db.Decimal(5, 4)
  sortOrder Int
  updatedAt DateTime @updatedAt
  updatedBy String?
}

// 7. 计算规则配置
model CalculationRule {
  id          String   @id @default(uuid())
  type        String
  target      String
  formula     String
  coefficient Decimal  @db.Decimal(5, 4)
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

// 8. 原料类别配置
model MaterialCategory {
  id        String   @id @default(uuid())
  name      String   @unique
  sortOrder Int
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```

---

## 二、后端 API 设计

```
GET    /api/v1/system-config/base-rate
PUT    /api/v1/system-config/base-rate

GET    /api/v1/system-config/exchange
PUT    /api/v1/system-config/exchange

GET    /api/v1/system-config/cif-shipping
PUT    /api/v1/system-config/cif-shipping

GET    /api/v1/system-config/fcl-shipping
PUT    /api/v1/system-config/fcl-shipping

GET    /api/v1/system-config/lcl-shipping
PUT    /api/v1/system-config/lcl-shipping

GET    /api/v1/system-config/profit-tiers
POST   /api/v1/system-config/profit-tiers
PUT    /api/v1/system-config/profit-tiers/:id
DELETE /api/v1/system-config/profit-tiers/:id

GET    /api/v1/system-config/calculation-rules
PUT    /api/v1/system-config/calculation-rules

GET    /api/v1/system-config/material-categories
POST   /api/v1/system-config/material-categories
PUT    /api/v1/system-config/material-categories/:id
DELETE /api/v1/system-config/material-categories/:id

GET    /api/v1/system-config/all
```

---

## 三、后端文件清单

```
apps/api/src/
├── routes/
│   └── system-config.routes.ts
├── controllers/
│   └── system-config.controller.ts
├── services/
│   └── system-config.service.ts
├── repositories/
│   └── system-config.repository.ts
└── lib/schemas.ts
```

---

## 四、前端文件清单

```
apps/web/
├── hooks/api/
│   ├── use-system-config.ts
│   ├── use-base-rate.ts
│   ├── use-exchange-config.ts
│   ├── use-shipping-config.ts
│   ├── use-profit-tiers.ts
│   ├── use-calculation-rules.ts
│   └── use-material-categories.ts
├── stores/
│   └── system-config.ts
├── app/(app)/system/
│   ├── page.tsx
│   ├── components/
│   │   ├── BusinessConfigTab.tsx
│   │   ├── CalculationRulesTab.tsx
│   │   ├── MaterialCategoriesTab.tsx
│   │   └── config-cards/
│   │       ├── BaseRateCard.tsx
│   │       ├── ExchangeCard.tsx
│   │       ├── CifShippingCard.tsx
│   │       ├── FclShippingCard.tsx
│   │       ├── LclShippingCard.tsx
│   │       └── ProfitTierCard.tsx
│   └── types.ts
```

---

## 五、数据初始化

```typescript
// packages/database/prisma/seed-system-config.ts
const defaultConfigs = {
  baseRate: {
    adminFeeRate: 0.2,
    vatRate: 0.13,
    insuranceRate: 0.003,
    vatRateOptions: [0.13, 0.10]
  },
  exchange: {
    exchangeRate: 7.2,
    laborCoefficient: 1.56,
    fobShenzhenRate: 7.1
  },
  cifShipping: {
    oceanFreight: 10,
    cfsFee: 60,
    documentFee: 500,
    customsFee: 400,
    warehouseFee: 130,
    truckingFee: 400
  },
  fclShipping: {
    fcl20Rate: 840,
    fcl40Rate: 940
  },
  lclShipping: [
    { minCbm: 1, maxCbm: 3, baseRate: 900, handlingFee: 500, cfsFee: 170, documentFee: 500 },
    { minCbm: 3, maxCbm: 5, baseRate: 1000, handlingFee: 500, cfsFee: 170, documentFee: 500 },
    { minCbm: 5, maxCbm: 8, baseRate: 1100, handlingFee: 500, cfsFee: 170, documentFee: 500 },
    { minCbm: 8, maxCbm: 10, baseRate: 1200, handlingFee: 500, cfsFee: 170, documentFee: 500 },
    { minCbm: 10, maxCbm: 12, baseRate: 1300, handlingFee: 500, cfsFee: 170, documentFee: 500 },
    { minCbm: 12, maxCbm: 15, baseRate: 1400, handlingFee: 500, cfsFee: 170, documentFee: 500 }
  ],
  profitTiers: [
    { rate: 0.05, sortOrder: 1 },
    { rate: 0.10, sortOrder: 2 },
    { rate: 0.25, sortOrder: 3 },
    { rate: 0.50, sortOrder: 4 }
  ],
  calculationRules: [
    { type: '主体', target: 'material', formula: 'multiply', coefficient: 0.99 },
    { type: '配件', target: 'material', formula: 'multiply', coefficient: 0.99 },
    { type: '滤毒盒', target: 'material', formula: 'divide', coefficient: 0.99 },
    { type: '滤棉', target: 'material', formula: 'divide', coefficient: 0.99 },
    { type: '滤饼', target: 'material', formula: 'divide', coefficient: 0.99 },
    { type: '主体', target: 'packaging', formula: 'multiply', coefficient: 0.99 },
    { type: '配件', target: 'packaging', formula: 'multiply', coefficient: 0.99 },
    { type: '滤毒盒', target: 'packaging', formula: 'multiply', coefficient: 0.99 },
    { type: '滤棉', target: 'packaging', formula: 'multiply', coefficient: 0.99 },
    { type: '滤饼', target: 'packaging', formula: 'multiply', coefficient: 0.99 }
  ]
}
```

---

## 六、实施步骤

### Phase 1: 数据库 (2小时)
1. 更新 `schema.prisma` 添加8个配置模型
2. 创建 `prisma/migrations/xxx_add_system_config` 迁移
3. 创建 `seed-system-config.ts` 初始化脚本
4. 运行 `pnpm db:migrate` 和 `pnpm db:seed`

### Phase 2: 后端 API (6小时)
1. 创建 `system-config.repository.ts` - 数据访问层
2. 创建 `system-config.service.ts` - 业务逻辑层
3. 创建 `system-config.controller.ts` - 控制器层
4. 创建 `system-config.routes.ts` - 路由定义
5. 更新 `routes/index.ts` 注册路由
6. 更新 `lib/schemas.ts` 添加 Zod 校验

### Phase 3: 前端 Hooks (2小时)
1. 创建 `stores/system-config.ts` Zustand store
2. 创建各配置模块的 API hooks
3. 统一导出 `hooks/api/index.ts`

### Phase 4: 前端页面 (4小时)
1. 重构 `system/page.tsx` 为 Tab 容器
2. 创建 `BusinessConfigTab.tsx` 业务配置Tab
3. 创建各配置卡片组件
4. 创建 `CalculationRulesTab.tsx` 计算规则Tab
5. 创建 `MaterialCategoriesTab.tsx` 原料类别Tab

### Phase 5: 测试与验证 (3小时)
1. API 单元测试
2. 前端组件测试
3. 集成测试
4. 数据初始化验证

---

## 七、项目影响评估

| 维度 | 影响 |
|------|------|
| **数据库** | 新增8张表，需要迁移和初始化 |
| **后端** | 新增约15个文件，20个API端点 |
| **前端** | 新增约20个文件，复杂表单交互 |
| **成本计算** | 需要改造以读取新配置 |
| **维护成本** | 配置模块独立，易于扩展 |

---

## 八、验证清单

- [ ] 数据库8张配置表已创建
- [ ] 默认配置数据已初始化
- [ ] GET /api/v1/system-config/all 返回完整配置
- [ ] 页面3个Tab正常切换
- [ ] 各配置卡片可正常编辑保存
- [ ] 利润档位可增删改
- [ ] 计算规则可配置
- [ ] 原料类别可增删改
- [ ] 非admin用户无法编辑
- [ ] 配置变更后成本计算使用新值
