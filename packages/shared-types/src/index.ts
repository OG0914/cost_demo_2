export * from './api.js'
export * from './packaging.js'

// ==================== 基础实体类型 ====================

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  updatedAt?: string
}

export interface Customer {
  id: string
  code: string
  name: string
  region: string
  note?: string
  createdAt: string
  updatedAt?: string
}

export interface Regulation {
  id: string
  code: string
  name: string
  description?: string
  status: string
  createdAt: string
  updatedAt?: string
}

export interface Material {
  id: string
  materialNo: string
  name: string
  unit: string
  price: number
  currency: string
  manufacturer?: string
  category?: string
  createdAt: string
  updatedAt?: string
}

export interface Model {
  id: string
  name: string
  regulationId: string
  category?: string
  series?: string
  imageUrl?: string
  bomCount?: number
  packagingConfigCount?: number
  createdAt: string
  updatedAt?: string
}

export interface PackagingConfig {
  id: string
  modelId: string
  name: string
  packagingType: string
  perBox?: number | null
  perCarton: number
  layer1: number
  layer2: number
  layer3?: number | null
  createdAt?: string
  updatedAt?: string
}

export type SaleType = 'domestic' | 'export'                                    // 销售类型
export type ShippingType = 'fcl20' | 'fcl40' | 'lcl'                            // 运输方式
export type QuotationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'   // 报价单状态

export interface Quotation {
  id: string
  quotationNo: string
  customerId: string
  customer?: Customer
  regulationId: string                  // 后端必有，补齐
  regulation?: Regulation               // 后端 include 返回，补齐
  modelId: string
  model?: Model
  packagingConfigId: string
  packagingConfig?: PackagingConfig      // unknown → 具体类型
  saleType: SaleType                     // string → 联合类型
  shippingType: ShippingType             // string → 联合类型
  quantity: number
  materialCost: number
  packagingCost: number
  processCost: number
  shippingCost: number
  adminFee: number
  vat: number
  totalCost: number
  status: QuotationStatus                // string → 联合类型
  createdBy: string
  reviewedBy?: string
  reviewedAt?: string                    // 后端有此字段，补齐
  reviewNote?: string
  createdAt: string
  updatedAt?: string
}

export interface SystemConfig {
  key: string
  value: Record<string, unknown>
  updatedAt: string
  updatedBy?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}
