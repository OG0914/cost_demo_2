// ==================== Swagger Schema Definitions ====================

// 通用响应结构
export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object' },
  },
} as const

export const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const

export const paginatedMetaSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 100 },
    totalPages: { type: 'integer', example: 5 },
  },
} as const

// 用户相关 Schema
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    username: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'] },
    status: { type: 'string', enum: ['active', 'inactive'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

// 认证相关 Schema
export const loginRequestSchema = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 1, description: '用户名' },
    password: { type: 'string', minLength: 6, description: '密码' },
  },
} as const

export const loginResponseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string', description: 'JWT token' },
    user: userSchema,
  },
} as const

// 法规相关 Schema
export const regulationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string', description: '法规代码' },
    name: { type: 'string', description: '法规名称' },
    description: { type: 'string', nullable: true, description: '法规描述' },
    status: { type: 'string', enum: ['active', 'inactive'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

export const createRegulationRequestSchema = {
  type: 'object',
  required: ['code', 'name'],
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, description: '法规代码' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '法规名称' },
    description: { type: 'string', maxLength: 500, description: '法规描述' },
    status: { type: 'string', enum: ['active', 'inactive'], description: '状态' },
  },
} as const

export const updateRegulationRequestSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, description: '法规代码' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '法规名称' },
    description: { type: 'string', maxLength: 500, description: '法规描述' },
    status: { type: 'string', enum: ['active', 'inactive'], description: '状态' },
  },
} as const

// 客户相关 Schema
export const customerSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string', description: '客户代码' },
    name: { type: 'string', description: '客户名称' },
    region: { type: 'string', description: '地区' },
    note: { type: 'string', nullable: true, description: '备注' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

export const createCustomerRequestSchema = {
  type: 'object',
  required: ['code', 'name', 'region'],
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, description: '客户代码' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '客户名称' },
    region: { type: 'string', minLength: 1, maxLength: 100, description: '地区' },
    note: { type: 'string', maxLength: 1000, description: '备注' },
  },
} as const

export const updateCustomerRequestSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 1, maxLength: 50, description: '客户代码' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '客户名称' },
    region: { type: 'string', minLength: 1, maxLength: 100, description: '地区' },
    note: { type: 'string', maxLength: 1000, description: '备注' },
  },
} as const

// 物料相关 Schema
export const materialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    materialNo: { type: 'string', description: '物料编号' },
    name: { type: 'string', description: '物料名称' },
    unit: { type: 'string', description: '单位' },
    price: { type: 'number', minimum: 0, description: '单价' },
    currency: { type: 'string', enum: ['CNY', 'USD'], description: '币种' },
    manufacturer: { type: 'string', nullable: true, description: '制造商' },
    category: { type: 'string', description: '分类' },
    note: { type: 'string', nullable: true, description: '备注' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

export const createMaterialRequestSchema = {
  type: 'object',
  required: ['materialNo', 'name', 'unit', 'price', 'category'],
  properties: {
    materialNo: { type: 'string', minLength: 1, maxLength: 50, description: '物料编号' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '物料名称' },
    unit: { type: 'string', minLength: 1, maxLength: 20, description: '单位' },
    price: { type: 'number', minimum: 0, description: '单价' },
    currency: { type: 'string', enum: ['CNY', 'USD'], description: '币种' },
    manufacturer: { type: 'string', maxLength: 100, description: '制造商' },
    category: { type: 'string', minLength: 1, maxLength: 50, description: '分类' },
    note: { type: 'string', maxLength: 1000, description: '备注' },
  },
} as const

export const updateMaterialRequestSchema = {
  type: 'object',
  properties: {
    materialNo: { type: 'string', minLength: 1, maxLength: 50, description: '物料编号' },
    name: { type: 'string', minLength: 1, maxLength: 100, description: '物料名称' },
    unit: { type: 'string', minLength: 1, maxLength: 20, description: '单位' },
    price: { type: 'number', minimum: 0, description: '单价' },
    currency: { type: 'string', enum: ['CNY', 'USD'], description: '币种' },
    manufacturer: { type: 'string', maxLength: 100, description: '制造商' },
    category: { type: 'string', minLength: 1, maxLength: 50, description: '分类' },
    note: { type: 'string', maxLength: 1000, description: '备注' },
  },
} as const

// 型号相关 Schema
export const modelSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', description: '型号名称' },
    category: { type: 'string', description: '分类' },
    series: { type: 'string', description: '系列' },
    imageUrl: { type: 'string', nullable: true, description: '图片URL' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
    regulation: regulationSchema,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

// BOM 相关 Schema
export const bomMaterialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    materialId: { type: 'string', format: 'uuid', description: '物料ID' },
    quantity: { type: 'number', minimum: 0, description: '数量' },
    sortOrder: { type: 'integer', description: '排序' },
    material: materialSchema,
    model: modelSchema,
  },
} as const

// 包装配置相关 Schema
export const packagingConfigSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', description: '配置名称' },
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    description: { type: 'string', nullable: true, description: '描述' },
    model: modelSchema,
  },
} as const

// 报价单相关 Schema
export const quotationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    customerId: { type: 'string', format: 'uuid', description: '客户ID' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
    shippingType: { type: 'string', enum: ['fcl20', 'fcl40', 'lcl'], description: '运输方式' },
    quantity: { type: 'integer', minimum: 1, description: '数量' },
    materialCost: { type: 'number', minimum: 0, description: '物料成本' },
    packagingCost: { type: 'number', minimum: 0, description: '包装成本' },
    processCost: { type: 'number', minimum: 0, description: '工序成本' },
    shippingCost: { type: 'number', minimum: 0, description: '运输成本' },
    adminFee: { type: 'number', minimum: 0, description: '管理费' },
    vat: { type: 'number', minimum: 0, description: '增值税' },
    totalCost: { type: 'number', minimum: 0, description: '总成本' },
    status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], description: '状态' },
    createdBy: { type: 'string', format: 'uuid', description: '创建人ID' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

export const createQuotationRequestSchema = {
  type: 'object',
  required: ['customerId', 'regulationId', 'modelId', 'packagingConfigId', 'saleType', 'shippingType', 'quantity', 'materialCost', 'packagingCost', 'processCost', 'shippingCost', 'adminFee', 'vat', 'totalCost'],
  properties: {
    customerId: { type: 'string', format: 'uuid', description: '客户ID' },
    regulationId: { type: 'string', format: 'uuid', description: '法规ID' },
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
    shippingType: { type: 'string', enum: ['fcl20', 'fcl40', 'lcl'], description: '运输方式' },
    quantity: { type: 'integer', minimum: 1, description: '数量' },
    materialCost: { type: 'number', minimum: 0, description: '物料成本' },
    packagingCost: { type: 'number', minimum: 0, description: '包装成本' },
    processCost: { type: 'number', minimum: 0, description: '工序成本' },
    shippingCost: { type: 'number', minimum: 0, description: '运输成本' },
    adminFee: { type: 'number', minimum: 0, description: '管理费' },
    vat: { type: 'number', minimum: 0, description: '增值税' },
    totalCost: { type: 'number', minimum: 0, description: '总成本' },
  },
} as const

export const calculateQuotationRequestSchema = {
  type: 'object',
  required: ['modelId', 'packagingConfigId', 'saleType', 'shippingType', 'quantity'],
  properties: {
    modelId: { type: 'string', format: 'uuid', description: '型号ID' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
    shippingType: { type: 'string', enum: ['fcl20', 'fcl40', 'lcl'], description: '运输方式' },
    quantity: { type: 'integer', minimum: 1, description: '数量' },
  },
} as const

// 标准成本相关 Schema
export const standardCostSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    packagingConfigId: { type: 'string', format: 'uuid', description: '包装配置ID' },
    saleType: { type: 'string', enum: ['domestic', 'export'], description: '销售类型' },
    version: { type: 'integer', description: '版本号' },
    isCurrent: { type: 'boolean', description: '是否当前版本' },
    materialCost: { type: 'number', minimum: 0, description: '物料成本' },
    packagingCost: { type: 'number', minimum: 0, description: '包装成本' },
    processCost: { type: 'number', minimum: 0, description: '工序成本' },
    shippingCost: { type: 'number', minimum: 0, description: '运输成本' },
    adminFee: { type: 'number', minimum: 0, description: '管理费' },
    vat: { type: 'number', minimum: 0, description: '增值税' },
    totalCost: { type: 'number', minimum: 0, description: '总成本' },
    setBy: { type: 'string', format: 'uuid', description: '设置人ID' },
    setAt: { type: 'string', format: 'date-time', description: '设置时间' },
    packagingConfig: packagingConfigSchema,
    setByUser: userSchema,
  },
} as const

// 通知相关 Schema
export const notificationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string', description: '通知类型' },
    title: { type: 'string', description: '标题' },
    message: { type: 'string', description: '内容' },
    status: { type: 'string', enum: ['pending', 'processed'], description: '状态' },
    materialId: { type: 'string', format: 'uuid', nullable: true, description: '相关物料ID' },
    triggeredAt: { type: 'string', format: 'date-time', description: '触发时间' },
    processedAt: { type: 'string', format: 'date-time', nullable: true, description: '处理时间' },
    processedBy: { type: 'string', format: 'uuid', nullable: true, description: '处理人ID' },
    material: materialSchema,
    processor: userSchema,
  },
} as const

// 仪表盘相关 Schema
export const dashboardStatsSchema = {
  type: 'object',
  properties: {
    totalQuotations: { type: 'integer', description: '报价单总数' },
    totalCustomers: { type: 'integer', description: '客户总数' },
    totalModels: { type: 'integer', description: '型号总数' },
    pendingReviews: { type: 'integer', description: '待审核数量' },
    quotationsTrend: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          week: { type: 'string' },
          count: { type: 'integer' },
        },
      },
    },
    regulationStats: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'integer' },
        },
      },
    },
    topModels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'integer' },
        },
      },
    },
  },
} as const

// 通用参数 Schema
export const uuidParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid', description: 'UUID' },
  },
} as const

export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, description: '页码' },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: '每页数量' },
  },
} as const
