/**
 * 数据库迁移配置
 * 定义表映射、字段映射和特殊转换规则
 */

import { TABLE_NAMES } from './uuid-converter.js';

/**
 * 字段映射配置：snake_case → camelCase（数据库列名）
 */
export const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  users: {
    id: 'id',
    username: 'username',
    password: 'password',
    real_name: 'name',        // 旧库real_name → 新库name
    email: 'email',
    role_code: 'role',        // 旧库role_code → 新库role
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  regulations: {
    id: 'id',
    name: 'code',           // 旧库name → 新库code
    description: 'name',    // 旧库description → 新库name
    is_active: 'status',    // 旧库is_active → 新库status
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  customers: {
    id: 'id',
    vc_code: 'code',        //旧库vc_code → 新库code
    name: 'name',
    region: 'region',
    remark: 'note',        //旧库remark → 新库note
    sales_person_id: 'sales_person_id',
    created_by: 'created_by',
    updated_by: 'updated_by',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  materials: {
    id: 'id',
    item_no: 'material_no',  // 旧库item_no → 新库material_no
    name: 'name',
    unit: 'unit',
    price: 'price',
    currency: 'currency',
    manufacturer: 'manufacturer',
    category: 'category',
    note: 'note',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  models: {
    id: 'id',
    name: 'name',
    regulation_id: 'regulation_id',
    category: 'category',
    series: 'series',
    image_url: 'image_url',
    calculation_type: 'calculation_type',  //JSONB格式
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  bom_materials: {
    id: 'id',
    model_id: 'model_id',
    material_id: 'material_id',
    quantity: 'quantity',
    sort_order: 'sort_order',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  packaging_configs: {
    id: 'id',
    model_id: 'model_id',
    name: 'name',
    packaging_type: 'packaging_type',
    per_box: 'per_box',
    per_carton: 'per_carton',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  process_configs: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    name: 'name',
    price: 'price',
    unit: 'unit',
    sort_order: 'sort_order',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  packaging_materials: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    name: 'name',
    quantity: 'quantity',
    price: 'price',
    box_length: 'box_length',
    box_width: 'box_width',
    box_height: 'box_height',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },
  quotations: {
    id: 'id',
    quotation_no: 'quotation_no',
    customer_id: 'customer_id',
    regulation_id: 'regulation_id',
    model_id: 'model_id',
    packaging_config_id: 'packaging_config_id',
    sale_type: 'sale_type',
    shipping_type: 'shipping_type',
    quantity: 'quantity',
    material_cost: 'material_cost',
    packaging_cost: 'packaging_cost',
    process_cost: 'process_cost',
    shipping_cost: 'shipping_cost',
    admin_fee: 'admin_fee',
    vat: 'vat',
    total_cost: 'total_cost',
    status: 'status',
    created_by: 'created_by',
    created_at: 'created_at',
    updated_at: 'updated_at',
    reviewed_by: 'reviewed_by',
    reviewed_at: 'reviewed_at',
    review_note: 'review_note',
  },
  standard_costs: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    sale_type: 'sale_type',
    version: 'version',
    is_current: 'is_current',
    material_cost: 'material_cost',
    packaging_cost: 'packaging_cost',
    process_cost: 'process_cost',
    shipping_cost: 'shipping_cost',
    admin_fee: 'admin_fee',
    vat: 'vat',
    total_cost: 'total_cost',
    set_by: 'set_by',
    set_at: 'set_at',
  },
  notifications: {
    id: 'id',
    type: 'type',
    status: 'status',
    material_id: 'material_id',
    old_price: 'old_price',
    new_price: 'new_price',
    affected_standard_costs: 'affected_standard_costs',  //数组类型
    triggered_by: 'triggered_by',
    triggered_at: 'triggered_at',
    processed_by: 'processed_by',
    processed_at: 'processed_at',
  },
  system_config: {
    key: 'key',
    value: 'value',
    updated_at: 'updated_at',
    updated_by: 'updated_by',
  },
};

/**
 * 外键依赖配置
 * 定义每个表的外键字段及其引用的表
 */
export const FOREIGN_KEYS: Record<string, Array<{ field: string; refTable: string }>> = {
  users: [],  //无依赖
  regulations: [],  //无依赖
  materials: [],  //无依赖
  customers: [
    { field: 'created_by', refTable: TABLE_NAMES.USERS },
    { field: 'updated_by', refTable: TABLE_NAMES.USERS },
    { field: 'sales_person_id', refTable: TABLE_NAMES.USERS },
  ],
  models: [
    { field: 'regulation_id', refTable: TABLE_NAMES.REGULATIONS },
  ],
  bom_materials: [
    { field: 'model_id', refTable: TABLE_NAMES.MODELS },
    { field: 'material_id', refTable: TABLE_NAMES.MATERIALS },
  ],
  packaging_configs: [
    { field: 'model_id', refTable: TABLE_NAMES.MODELS },
  ],
  process_configs: [
    { field: 'packaging_config_id', refTable: TABLE_NAMES.PACKAGING_CONFIGS },
  ],
  packaging_materials: [
    { field: 'packaging_config_id', refTable: TABLE_NAMES.PACKAGING_CONFIGS },
  ],
  quotations: [
    { field: 'customer_id', refTable: TABLE_NAMES.CUSTOMERS },
    { field: 'regulation_id', refTable: TABLE_NAMES.REGULATIONS },
    { field: 'model_id', refTable: TABLE_NAMES.MODELS },
    { field: 'packaging_config_id', refTable: TABLE_NAMES.PACKAGING_CONFIGS },
    { field: 'created_by', refTable: TABLE_NAMES.USERS },
    { field: 'reviewed_by', refTable: TABLE_NAMES.USERS },
  ],
  standard_costs: [
    { field: 'packaging_config_id', refTable: TABLE_NAMES.PACKAGING_CONFIGS },
    { field: 'set_by', refTable: TABLE_NAMES.USERS },
  ],
  notifications: [
    { field: 'material_id', refTable: TABLE_NAMES.MATERIALS },
    { field: 'triggered_by', refTable: TABLE_NAMES.USERS },
    { field: 'processed_by', refTable: TABLE_NAMES.USERS },
  ],
  system_config: [
    { field: 'updated_by', refTable: TABLE_NAMES.USERS },
  ],
};

/**
 * 旧表名到新表名的映射
 * 当旧库表名与新库不同时使用
 */
export const OLD_TABLE_NAMES: Record<string, string> = {
  // 新表名: 旧表名
  bom_materials: 'model_bom_materials',
};

/**
 * 获取旧表名
 */
export function getOldTableName(newTableName: string): string {
  return OLD_TABLE_NAMES[newTableName] || newTableName;
}

/**
 * 迁移顺序（按依赖关系从低到高）
 */
export const MIGRATION_ORDER = [
  //第1层：无依赖表
  TABLE_NAMES.USERS,
  TABLE_NAMES.REGULATIONS,
  TABLE_NAMES.MATERIALS,
  TABLE_NAMES.CUSTOMERS,

  //第2层：依赖第1层
  TABLE_NAMES.MODELS,  //依赖 regulations

  //第3层：依赖第1-2层
  TABLE_NAMES.BOM_MATERIALS,  //依赖 models, materials
  TABLE_NAMES.PACKAGING_CONFIGS,  //依赖 models

  //第4层：依赖第3层
  TABLE_NAMES.PROCESS_CONFIGS,  //依赖 packaging_configs
  TABLE_NAMES.PACKAGING_MATERIALS,  //依赖 packaging_configs

  //第5层：依赖第1-4层
  TABLE_NAMES.QUOTATIONS,  //依赖 customers, regulations, models, packaging_configs, users
  TABLE_NAMES.STANDARD_COSTS,  //依赖 packaging_configs, users

  //第6层：依赖第1层
  TABLE_NAMES.NOTIFICATIONS,  //依赖 materials, users

  //第7层：系统配置
  TABLE_NAMES.SYSTEM_CONFIG,  //依赖 users
];

/**
 * 枚举值映射（旧值 → 新值）
 */
export const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  //用户角色映射
  role: {
    admin: 'admin',
    purchaser: 'purchaser',
    producer: 'producer',
    reviewer: 'reviewer',
    sales: 'salesperson',      //旧sales → 新salesperson
    readonly: 'readonly',
  },
  //用户状态映射
  user_status: {
    active: 'active',
    inactive: 'inactive',
    disabled: 'inactive',      //旧disabled → 新inactive
  },
  //法规状态映射
  regulation_status: {
    active: 'active',
    inactive: 'inactive',
    true: 'active',      //旧库布尔值true → 新库active
    false: 'inactive',   //旧库布尔值false → 新库inactive
  },
  //报价单状态映射
  quotation_status: {
    draft: 'draft',
    pending: 'submitted',      //旧pending → 新submitted
    approved: 'approved',
    rejected: 'rejected',
  },
  //销售类型映射
  sale_type: {
    domestic: 'domestic',
    export: 'export',
  },
  //运输类型映射
  shipping_type: {
    fcl20: 'fcl20',
    fcl40: 'fcl40',
    lcl: 'lcl',
  },
  //工序单位映射
  process_unit: {
    piece: 'piece',
    dozen: 'dozen',
    pcs: 'piece',              //旧pcs → 新piece
  },
  //通知类型映射
  notification_type: {
    price_change: 'price_change',
    material_delete: 'material_delete',
  },
  //通知状态映射
  notification_status: {
    pending: 'pending',
    processed: 'processed',
    archived: 'archived',
  },
};

/**
 * 特殊字段转换函数
 */
export const SPECIAL_CONVERTERS = {
  /**
   * 转换calculation_type字段（JSONB格式）
   * 旧库可能是字符串或JSON对象，统一转换为JSONB
   */
  calculation_type: (value: any): object | null => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { type: value };  //如果解析失败，包装为对象
      }
    }
    if (typeof value === 'object') {
      return value;
    }
    return null;
  },

  /**
   * 转换货币字段
   * 确保值为有效的枚举值
   */
  currency: (value: string): string => {
    const validCurrencies = ['CNY', 'USD'];
    return validCurrencies.includes(value) ? value : 'CNY';
  },

  /**
   * 转换Decimal字段
   * 确保值为有效的数字字符串
   */
  decimal: (value: any, precision: number = 2): string => {
    if (value === null || value === undefined) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(precision);
  },

  /**
   * 转换数组字段（PostgreSQL数组类型）
   */
  array: (value: any): string[] | null => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return null;
  },
};

/**
 * 数据库连接配置
 */
export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * 从连接字符串解析配置
 */
export function parseConnectionString(url: string): DbConfig {
  //格式: postgresql://user:password@host:port/database
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid database connection string format');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

/**
 * 迁移配置选项
 */
export interface MigrationOptions {
  batchSize: number;           //每批处理的记录数
  enableTransaction: boolean;  //是否使用事务
  skipOnError: boolean;        //错误时是否跳过继续
  dryRun: boolean;             //是否仅模拟运行
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 默认迁移配置
 */
export const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  batchSize: 1000,
  enableTransaction: true,
  skipOnError: true,
  dryRun: false,
  logLevel: 'info',
};
