// 业务常量定义

// ==================== 分页配置 ====================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// ==================== 报价单状态 ====================

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const QUOTATION_STATUS_LABEL: Record<string, string> = {
  [QUOTATION_STATUS.DRAFT]: '草稿',
  [QUOTATION_STATUS.SUBMITTED]: '待审核',
  [QUOTATION_STATUS.APPROVED]: '已批准',
  [QUOTATION_STATUS.REJECTED]: '已拒绝',
} as const

// ==================== 销售类型 ====================

export const SALE_TYPE = {
  DOMESTIC: 'domestic',
  EXPORT: 'export',
} as const

export const SALE_TYPE_LABEL: Record<string, string> = {
  [SALE_TYPE.DOMESTIC]: '内销',
  [SALE_TYPE.EXPORT]: '外销',
} as const

// ==================== 运输方式 ====================

export const SHIPPING_TYPE = {
  FCL_20: 'fcl20',
  FCL_40: 'fcl40',
  LCL: 'lcl',
} as const

export const SHIPPING_TYPE_LABEL: Record<string, string> = {
  [SHIPPING_TYPE.FCL_20]: '20尺整柜',
  [SHIPPING_TYPE.FCL_40]: '40尺整柜',
  [SHIPPING_TYPE.LCL]: '拼箱',
} as const

// ==================== 用户角色 ====================

export const USER_ROLE = {
  ADMIN: 'admin',
  PURCHASER: 'purchaser',
  PRODUCER: 'producer',
  REVIEWER: 'reviewer',
  SALESPERSON: 'salesperson',
  READONLY: 'readonly',
} as const

export const USER_ROLE_LABEL: Record<string, string> = {
  [USER_ROLE.ADMIN]: '管理员',
  [USER_ROLE.PURCHASER]: '采购员',
  [USER_ROLE.PRODUCER]: '生产员',
  [USER_ROLE.REVIEWER]: '审核员',
  [USER_ROLE.SALESPERSON]: '销售员',
  [USER_ROLE.READONLY]: '只读用户',
} as const

// ==================== 启用状态 ====================

export const ACTIVE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const ACTIVE_STATUS_LABEL: Record<string, string> = {
  [ACTIVE_STATUS.ACTIVE]: '启用',
  [ACTIVE_STATUS.INACTIVE]: '禁用',
} as const

// ==================== 通知类型 ====================

export const NOTIFICATION_TYPE = {
  PRICE_CHANGE: 'price_change',
  MATERIAL_DELETE: 'material_delete',
} as const

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  [NOTIFICATION_TYPE.PRICE_CHANGE]: '价格变更',
  [NOTIFICATION_TYPE.MATERIAL_DELETE]: '原料删除',
} as const

// ==================== 通知状态 ====================

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  ARCHIVED: 'archived',
} as const

export const NOTIFICATION_STATUS_LABEL: Record<string, string> = {
  [NOTIFICATION_STATUS.PENDING]: '待处理',
  [NOTIFICATION_STATUS.PROCESSED]: '已处理',
  [NOTIFICATION_STATUS.ARCHIVED]: '已归档',
} as const

// ==================== 法规类型 ====================

export const REGULATION_TYPE = {
  GB: 'GB',
  EN: 'EN',
  NIOSH: 'NIOSH',
  AS_NZS: 'AS/NZS',
} as const

export const REGULATION_TYPE_LABEL: Record<string, string> = {
  [REGULATION_TYPE.GB]: '中国国家标准',
  [REGULATION_TYPE.EN]: '欧洲标准',
  [REGULATION_TYPE.NIOSH]: '美国NIOSH标准',
  [REGULATION_TYPE.AS_NZS]: '澳洲/新西兰标准',
} as const

// ==================== 产品类别 ====================

export const PRODUCT_CATEGORY = {
  HALF_MASK: '半面罩',
  MASK: '口罩',
} as const

// ==================== 包装类型 ====================

export const PACKAGING_TYPE = {
  SINGLE: '单件',
  BULK: '散装',
  BOX: '盒装',
} as const

export const PACKAGING_TYPE_LABEL: Record<string, string> = {
  [PACKAGING_TYPE.SINGLE]: '单件装',
  [PACKAGING_TYPE.BULK]: '散装',
  [PACKAGING_TYPE.BOX]: '盒装',
} as const

// ==================== 工序单位 ====================

export const PROCESS_UNIT = {
  PIECE: 'piece',
  DOZEN: 'dozen',
} as const

export const PROCESS_UNIT_LABEL: Record<string, string> = {
  [PROCESS_UNIT.PIECE]: '个',
  [PROCESS_UNIT.DOZEN]: '打',
} as const

// ==================== 货币类型 ====================

export const CURRENCY = {
  CNY: 'CNY',
  USD: 'USD',
} as const

export const CURRENCY_LABEL: Record<string, string> = {
  [CURRENCY.CNY]: '人民币',
  [CURRENCY.USD]: '美元',
} as const

export const CURRENCY_SYMBOL: Record<string, string> = {
  [CURRENCY.CNY]: '¥',
  [CURRENCY.USD]: '$',
} as const

// ==================== 表单验证规则 ====================

export const VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MIN_PASSWORD_LENGTH: 6,
  MAX_TEXT_LENGTH: 500,
} as const

// ==================== 缓存时间（秒） ====================

export const CACHE_TIME = {
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟
  LONG: 3600, // 1小时
  DAY: 86400, // 1天
} as const

// ==================== 路由路径 ====================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  COST: {
    ROOT: '/cost',
    NEW: '/cost/new',
    RECORDS: '/cost/records',
    COMPARE: '/cost/compare',
    STANDARD: '/cost/standard',
  },
  MASTER: {
    ROOT: '/master',
    MATERIALS: '/master/materials',
    CUSTOMERS: '/master/customers',
    MODELS: '/master/models',
    BOM: '/master/bom',
    PACKAGING: '/master/packaging',
    PROCESSES: '/master/processes',
    REGULATIONS: '/master/regulations',
  },
  REVIEW: {
    PENDING: '/review/pending',
    COMPLETED: '/review/completed',
  },
  NOTIFICATIONS: '/notifications',
  SYSTEM: '/system',
} as const

// ==================== 表格列宽预设 ====================

export const COLUMN_WIDTH = {
  XS: '60px',
  SM: '80px',
  MD: '120px',
  LG: '160px',
  XL: '200px',
  AUTO: 'auto',
} as const
