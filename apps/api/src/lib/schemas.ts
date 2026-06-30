import { z } from 'zod'

// ==================== 通用验证规则 ====================

const idSchema = z.string().uuid('无效的ID格式')

const emailSchema = z.string().email('邮箱格式不正确')

const positiveDecimalSchema = z.number().nonnegative('数值不能为负数')

const positiveIntSchema = z.number().int().positive('必须是正整数')

// ==================== Auth Schemas ====================

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ==================== User Schemas ====================

export const userRoleSchema = z.enum(['admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly'])

export const userStatusSchema = z.enum(['active', 'inactive'])

export const createUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名最多50字符'),
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100字符'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50字符'),
  email: emailSchema,
  role: userRoleSchema,
  status: userStatusSchema.optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50字符').optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100字符').optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ==================== Regulation Schemas ====================

export const regulationStatusSchema = z.enum(['active', 'inactive'])

export const createRegulationSchema = z.object({
  code: z.string().min(1, '法规代码不能为空').max(50, '法规代码最多50字符'),
  name: z.string().min(1, '法规名称不能为空').max(100, '法规名称最多100字符'),
  description: z.string().max(500, '描述最多500字符').optional(),
  status: regulationStatusSchema.optional(),
})

export const updateRegulationSchema = z.object({
  code: z.string().min(1, '法规代码不能为空').max(50, '法规代码最多50字符').optional(),
  name: z.string().min(1, '法规名称不能为空').max(100, '法规名称最多100字符').optional(),
  description: z.string().max(500, '描述最多500字符').optional(),
  status: regulationStatusSchema.optional(),
})

export type CreateRegulationInput = z.infer<typeof createRegulationSchema>
export type UpdateRegulationInput = z.infer<typeof updateRegulationSchema>

// ==================== Customer Schemas ====================

export const createCustomerSchema = z.object({
  code: z.string().min(1, '客户代码不能为空').max(50, '客户代码最多50字符'),
  name: z.string().min(1, '客户名称不能为空').max(100, '客户名称最多100字符'),
  region: z.string().min(1, '地区不能为空').max(100, '地区最多100字符'),
  note: z.string().max(1000, '备注最多1000字符').optional(),
})

export const updateCustomerSchema = z.object({
  code: z.string().min(1, '客户代码不能为空').max(50, '客户代码最多50字符').optional(),
  name: z.string().min(1, '客户名称不能为空').max(100, '客户名称最多100字符').optional(),
  region: z.string().min(1, '地区不能为空').max(100, '地区最多100字符').optional(),
  note: z.string().max(1000, '备注最多1000字符').optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

// ==================== Material Schemas ====================

export const currencySchema = z.enum(['CNY', 'USD'])

export const createMaterialSchema = z.object({
  materialNo: z.string().min(1, '物料编号不能为空').max(50, '物料编号最多50字符'),
  name: z.string().min(1, '物料名称不能为空').max(100, '物料名称最多100字符'),
  unit: z.string().min(1, '单位不能为空').max(20, '单位最多20字符'),
  price: positiveDecimalSchema,
  currency: currencySchema.optional(),
  manufacturer: z.string().max(100, '制造商最多100字符').optional(),
  category: z.string().min(1, '分类不能为空').max(50, '分类最多50字符'),
  note: z.string().max(1000, '备注最多1000字符').optional(),
})

export const updateMaterialSchema = z.object({
  materialNo: z.string().min(1, '物料编号不能为空').max(50, '物料编号最多50字符').optional(),
  name: z.string().min(1, '物料名称不能为空').max(100, '物料名称最多100字符').optional(),
  unit: z.string().min(1, '单位不能为空').max(20, '单位最多20字符').optional(),
  price: positiveDecimalSchema.optional(),
  currency: currencySchema.optional(),
  manufacturer: z.string().max(100, '制造商最多100字符').optional(),
  category: z.string().min(1, '分类不能为空').max(50, '分类最多50字符').optional(),
  note: z.string().max(1000, '备注最多1000字符').optional(),
})

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>

// ==================== Packaging Material Schemas ====================

export const createPackagingMaterialSchema = z.object({
  materialId: idSchema,
  quantity: positiveDecimalSchema,
  boxLength: positiveDecimalSchema.optional(),
  boxWidth: positiveDecimalSchema.optional(),
  boxHeight: positiveDecimalSchema.optional(),
  boxVolume: positiveDecimalSchema.optional(),
})

export const updatePackagingMaterialSchema = z.object({
  materialId: idSchema.optional(),
  quantity: positiveDecimalSchema.optional(),
  boxLength: positiveDecimalSchema.optional(),
  boxWidth: positiveDecimalSchema.optional(),
  boxHeight: positiveDecimalSchema.optional(),
  boxVolume: positiveDecimalSchema.optional(),
})

export type CreatePackagingMaterialInput = z.infer<typeof createPackagingMaterialSchema>
export type UpdatePackagingMaterialInput = z.infer<typeof updatePackagingMaterialSchema>

// ==================== Quotation Schemas ====================

export const saleTypeSchema = z.enum(['domestic', 'export'])

export const shippingTypeSchema = z.enum(['fcl20', 'fcl40', 'lcl'])

export const createQuotationSchema = z.object({
  customerId: idSchema,
  regulationId: idSchema,
  modelId: idSchema,
  packagingConfigId: idSchema,
  saleType: saleTypeSchema,
  shippingType: shippingTypeSchema,
  quantity: positiveIntSchema,
  materialCost: positiveDecimalSchema,
  packagingCost: positiveDecimalSchema,
  processCost: positiveDecimalSchema,
  shippingCost: positiveDecimalSchema,
  adminFee: positiveDecimalSchema,
  vat: positiveDecimalSchema,
  totalCost: positiveDecimalSchema,
})

export const updateQuotationSchema = z.object({
  customerId: idSchema.optional(),
  regulationId: idSchema.optional(),
  modelId: idSchema.optional(),
  packagingConfigId: idSchema.optional(),
  saleType: saleTypeSchema.optional(),
  shippingType: shippingTypeSchema.optional(),
  quantity: positiveIntSchema.optional(),
  materialCost: positiveDecimalSchema.optional(),
  packagingCost: positiveDecimalSchema.optional(),
  processCost: positiveDecimalSchema.optional(),
  shippingCost: positiveDecimalSchema.optional(),
  adminFee: positiveDecimalSchema.optional(),
  vat: positiveDecimalSchema.optional(),
  totalCost: positiveDecimalSchema.optional(),
})

export const calculateQuotationSchema = z.object({
  modelId: idSchema,
  packagingConfigId: idSchema,
  saleType: saleTypeSchema,
  shippingType: shippingTypeSchema,
  quantity: positiveIntSchema,
})

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>
export type CalculateQuotationInput = z.infer<typeof calculateQuotationSchema>

// ==================== PackagingConfig Schemas ====================

export const createPackagingConfigSchema = z.object({
  modelId: z.string().uuid('型号ID格式不正确'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100字符'),
  packagingType: z.enum(['standard_box', 'no_box', 'blister_direct', 'blister_bag'], {
    message: '包装类型必须是 standard_box、no_box、blister_direct 或 blister_bag',
  }),
  layer1: z.number().int().positive('layer1 必须为正整数'),
  layer2: z.number().int().positive('layer2 必须为正整数'),
  layer3: z.number().int().positive('layer3 必须为正整数').optional(),
})

export const updatePackagingConfigSchema = createPackagingConfigSchema
  .omit({ modelId: true })
  .partial()

export type CreatePackagingConfigInput = z.infer<typeof createPackagingConfigSchema>
export type UpdatePackagingConfigInput = z.infer<typeof updatePackagingConfigSchema>

// ==================== ProcessConfig Schemas ====================

export const processUnitSchema = z.enum(['piece', 'dozen'])

export const createProcessConfigSchema = z.object({
  name: z.string().min(1, '工序名称不能为空').max(100, '工序名称最多100字符'),
  price: z.number().nonnegative('单价不能为负数'),
  unit: processUnitSchema,
  sortOrder: z.number().int().nonnegative('排序必须为非负整数').optional(),
})

export const updateProcessConfigSchema = createProcessConfigSchema.partial()

export type CreateProcessConfigInput = z.infer<typeof createProcessConfigSchema>
export type UpdateProcessConfigInput = z.infer<typeof updateProcessConfigSchema>

// ==================== BomMaterial Schemas ====================

export const createBomMaterialSchema = z.object({
  modelId: z.string().uuid('型号ID格式不正确'),
  materialId: z.string().uuid('物料ID格式不正确'),
  quantity: z.number().positive('数量必须大于0'),
  sortOrder: z.number().int().nonnegative('排序必须为非负整数').optional(),
})

export const updateBomMaterialSchema = createBomMaterialSchema
  .omit({ modelId: true, materialId: true })
  .partial()

export type CreateBomMaterialInput = z.infer<typeof createBomMaterialSchema>
export type UpdateBomMaterialInput = z.infer<typeof updateBomMaterialSchema>

// ==================== Model Schemas ====================

export const createModelSchema = z.object({
  name: z.string().min(1, '型号名称不能为空').max(100, '型号名称最多100字符'),
  regulationId: z.string().uuid('法规ID格式不正确'),
  category: z.string().min(1, '分类不能为空').max(50, '分类最多50字符'),
  series: z.string().min(1, '系列不能为空').max(100, '系列最多100字符'),
  imageUrl: z.string().url('图片URL格式不正确').optional().or(z.literal('')),
})

export const updateModelSchema = createModelSchema.partial()

export type CreateModelInput = z.infer<typeof createModelSchema>
export type UpdateModelInput = z.infer<typeof updateModelSchema>

// ==================== StandardCost Schemas ====================

export const createStandardCostSchema = z.object({
  packagingConfigId: z.string().uuid('包装配置ID格式不正确'),
  saleType: saleTypeSchema,
  materialCost: positiveDecimalSchema,
  packagingCost: positiveDecimalSchema,
  processCost: positiveDecimalSchema,
  shippingCost: positiveDecimalSchema,
  adminFee: positiveDecimalSchema,
  vat: positiveDecimalSchema,
  totalCost: positiveDecimalSchema,
})

export type CreateStandardCostInput = z.infer<typeof createStandardCostSchema>

// ==================== 验证辅助函数 ====================

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.errors[0].message }
}

// ==================== SystemConfig Schemas ====================

export const systemConfigValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.any()),
  z.array(z.any()),
])

export const updateSystemConfigSchema = z.object({
  value: systemConfigValueSchema,
})

export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>

export function formatZodError(error: z.ZodError): string {
  return error.errors[0].message
}
