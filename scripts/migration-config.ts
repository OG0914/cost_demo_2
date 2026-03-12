/**
 * 数据库迁移配置
 * 定义表映射、字段映射和特殊转换规则
 *
 * 基于旧库 (cost_analysis) 和新库 (cost_analysis_v2) 的实际字段结构
 */

import { TABLE_NAMES } from './uuid-converter.js';

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
 * 字段映射配置
 * key: 新库表名
 * value: { 旧库字段名: 新库字段名 }
 *
 * 注意：只包含有映射关系的字段，旧库有但新库没有的字段会被忽略
 */
export const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  // ==================== users ====================
  // 旧库字段：id, username, password, role, real_name, email, is_active, created_at, updated_at
  // 新库字段：id, username, password, name, email, role, status, created_at, updated_at
  users: {
    id: 'id',
    username: 'username',
    password: 'password',
    role: 'role',           // 需要枚举值转换
    real_name: 'name',      // 旧库 real_name -> 新库 name
    email: 'email',
    is_active: 'status',    // 旧库 is_active -> 新库 status (布尔转枚举)
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== regulations ====================
  // 旧库字段：id, name, description, is_active, created_at, updated_at
  // 新库字段：id, code, name, description, status, created_at, updated_at
  regulations: {
    id: 'id',
    name: 'code',           // 旧库 name -> 新库 code
    description: 'name',    // 旧库 description -> 新库 name (如果 description 为空，使用 name)
    is_active: 'status',    // 布尔转枚举
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== materials ====================
  // 旧库字段：id, item_no, name, unit, price, currency, manufacturer, category,
  //           deleted_at, material_type, subcategory, product_desc, packaging_mode, supplier,
  //           production_date, moq, remark, production_cycle, usage_amount, created_at, updated_at
  // 新库字段：id, material_no, name, unit, price, currency, manufacturer, category, note, created_at, updated_at
  materials: {
    id: 'id',
    item_no: 'material_no', // 旧库 item_no -> 新库 material_no
    name: 'name',
    unit: 'unit',
    price: 'price',
    currency: 'currency',
    manufacturer: 'manufacturer',
    category: 'category',
    remark: 'note',         // 旧库 remark -> 新库 note
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== customers ====================
  // 旧库字段：id, vc_code, name, region, remark, created_at, updated_at, user_id
  // 新库字段：id, code, name, region, note, sales_person_id, created_by, updated_by, created_at, updated_at
  customers: {
    id: 'id',
    vc_code: 'code',        // 旧库 vc_code -> 新库 code
    name: 'name',
    region: 'region',
    remark: 'note',         // 旧库 remark -> 新库 note
    user_id: 'sales_person_id', // 旧库 user_id -> 新库 sales_person_id
    // 这些字段在旧库不存在，会由 buildInsertSql 使用默认值填充
    created_by: 'created_by',
    updated_by: 'updated_by',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== models ====================
  // 旧库字段：id, regulation_id, model_name, model_category, is_active, created_at, updated_at, model_series, calculation_type
  // 新库字段：id, name, regulation_id, category, series, image_url, calculation_type, created_at, updated_at
  models: {
    id: 'id',
    regulation_id: 'regulation_id',
    model_name: 'name',         // 旧库 model_name -> 新库 name
    model_category: 'category', // 旧库 model_category -> 新库 category
    model_series: 'series',     // 旧库 model_series -> 新库 series
    // image_url: 旧库没有，设为 null
    calculation_type: 'calculation_type', // 需要类型转换 (varchar -> jsonb)
    // is_active 字段新库没有，忽略
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== bom_materials (旧表名: model_bom_materials) ====================
  // 旧库字段：id, model_id, material_id, usage_amount, sort_order, is_active, created_at, updated_at
  // 新库字段：id, model_id, material_id, quantity, sort_order, created_at, updated_at
  bom_materials: {
    id: 'id',
    model_id: 'model_id',
    material_id: 'material_id',
    usage_amount: 'quantity',   // 旧库 usage_amount -> 新库 quantity
    sort_order: 'sort_order',
    // is_active 新库没有，忽略
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== packaging_configs ====================
  // 旧库字段：id, model_id, config_name, pc_per_bag, bags_per_box, boxes_per_carton, is_active,
  //           created_at, updated_at, packaging_type, layer1_qty, layer2_qty, layer3_qty, factory,
  //           last_modified_by, last_process_total
  // 新库字段：id, model_id, name, packaging_type, per_box, per_carton, created_at, updated_at
  packaging_configs: {
    id: 'id',
    model_id: 'model_id',
    config_name: 'name',        // 旧库 config_name -> 新库 name
    packaging_type: 'packaging_type',
    // per_box 和 per_carton 是计算字段，在 COMPUTED_FIELDS 中定义
    // 但需要在映射中占位，让 buildInsertSql 知道要包含这些字段
    pc_per_bag: 'per_box',      // 占位，实际值由计算字段生成
    bags_per_box: 'per_carton', // 占位，实际值由计算字段生成
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== process_configs ====================
  // 旧库字段：id, packaging_config_id, process_name, unit_price, sort_order, is_active, created_at, updated_at
  // 新库字段：id, packaging_config_id, name, price, unit, sort_order, created_at, updated_at
  process_configs: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    process_name: 'name',       // 旧库 process_name -> 新库 name
    unit_price: 'price',        // 旧库 unit_price -> 新库 price
    // unit: 新库需要，旧库没有，使用 DEFAULT_VALUES 中的默认值 'piece'
    id2: 'unit',                // 占位符，实际使用默认值
    sort_order: 'sort_order',
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== packaging_materials ====================
  // 旧库字段：id, packaging_config_id, material_name, basic_usage, unit_price, carton_volume,
  //           sort_order, is_active, created_at, updated_at
  // 新库字段：id, packaging_config_id, name, quantity, price, box_length, box_width, box_height, created_at, updated_at
  packaging_materials: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    material_name: 'name',      // 旧库 material_name -> 新库 name
    basic_usage: 'quantity',    // 旧库 basic_usage -> 新库 quantity
    unit_price: 'price',        // 旧库 unit_price -> 新库 price
    // box_length/box_width/box_height: 旧库没有，设为 null
    created_at: 'created_at',
    updated_at: 'updated_at',
  },

  // ==================== quotations ====================
  // 旧库字段：id, quotation_no, customer_name, customer_region, model_id, regulation_id, quantity,
  //           freight_total, freight_per_unit, sales_type, shipping_method, port, base_cost,
  //           overhead_price, final_price, currency, status, created_by, reviewed_by,
  //           packaging_config_id, include_freight_in_base, custom_profit_tiers, vat_rate,
  //           created_at, updated_at, submitted_at, reviewed_at, customer_id, batch_id, batch_remark,
  //           source_standard_cost_id, is_estimation, reference_standard_cost_id, deleted_at
  // 新库字段：id, quotation_no, customer_id, regulation_id, model_id, packaging_config_id, sale_type,
  //           shipping_type, quantity, material_cost, packaging_cost, process_cost, shipping_cost,
  //           admin_fee, vat, total_cost, status, created_by, created_at, updated_at, reviewed_by,
  //           reviewed_at, review_note
  quotations: {
    id: 'id',
    quotation_no: 'quotation_no',
    customer_id: 'customer_id',
    regulation_id: 'regulation_id',
    model_id: 'model_id',
    packaging_config_id: 'packaging_config_id',
    sales_type: 'sale_type',        // 需要枚举值转换
    shipping_method: 'shipping_type', // 旧库 shipping_method -> 新库 shipping_type
    quantity: 'quantity',
    freight_total: 'shipping_cost', // 旧库 freight_total -> 新库 shipping_cost
    final_price: 'total_cost',      // 旧库 final_price -> 新库 total_cost
    status: 'status',               // 需要枚举值转换
    created_by: 'created_by',
    created_at: 'created_at',
    updated_at: 'updated_at',
    reviewed_by: 'reviewed_by',
    reviewed_at: 'reviewed_at',
    // 占位符字段，使用 DEFAULT_VALUES 中的默认值
    _material_cost: 'material_cost',
    _packaging_cost: 'packaging_cost',
    _process_cost: 'process_cost',
    _admin_fee: 'admin_fee',
    _vat: 'vat',
    _review_note: 'review_note',
  },

  // ==================== standard_costs ====================
  // 旧库字段：id, packaging_config_id, sales_type, version, is_current, material_cost, packaging_cost,
  //           process_cost, shipping_cost, admin_fee, vat, total_cost, set_by, quotation_id, created_at, updated_at
  // 新库字段：id, packaging_config_id, sale_type, version, is_current, material_cost, packaging_cost,
  //           process_cost, shipping_cost, admin_fee, vat, total_cost, set_by, set_at
  standard_costs: {
    id: 'id',
    packaging_config_id: 'packaging_config_id',
    sales_type: 'sale_type',        // 需要枚举值转换
    version: 'version',
    is_current: 'is_current',
    // 旧库字段映射到新库
    base_cost: 'material_cost',      // 旧库 base_cost -> 新库 material_cost (近似)
    overhead_price: 'admin_fee',     // 旧库 overhead_price -> 新库 admin_fee (近似)
    set_by: 'set_by',
    created_at: 'set_at',           // 旧库 created_at -> 新库 set_at
    // 占位符字段，使用 DEFAULT_VALUES 中的默认值
    _packaging_cost: 'packaging_cost',
    _process_cost: 'process_cost',
    _shipping_cost: 'shipping_cost',
    _vat: 'vat',
    _total_cost: 'total_cost',
  },

  // ==================== notifications ====================
  // 旧库：复杂的通知表，新库结构完全不同
  // 由于结构差异太大，暂不迁移 notifications
  notifications: {},

  // ==================== system_config ====================
  // 旧库字段：id, config_key, config_value, config_type
  // 新库字段：key, value, updated_at, updated_by
  // 结构完全不同，需要特殊处理
  system_config: {
    config_key: 'key',
    config_value: 'value',
    // 占位符字段，使用 DEFAULT_VALUES 中的默认值
    _updated_at: 'updated_at',
    _updated_by: 'updated_by',
  },
};

/**
 * 外键依赖配置
 * 定义每个表的外键字段及其引用的表
 */
export const FOREIGN_KEYS: Record<string, Array<{ field: string; refTable: string }>> = {
  users: [],
  regulations: [],
  materials: [],
  customers: [
    { field: 'sales_person_id', refTable: TABLE_NAMES.USERS },
    { field: 'created_by', refTable: TABLE_NAMES.USERS },
    { field: 'updated_by', refTable: TABLE_NAMES.USERS },
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
 * 迁移顺序（按依赖关系从低到高）
 */
export const MIGRATION_ORDER = [
  // 第1层：无依赖表
  TABLE_NAMES.USERS,
  TABLE_NAMES.REGULATIONS,
  TABLE_NAMES.MATERIALS,

  // 第2层：依赖第1层
  TABLE_NAMES.CUSTOMERS,
  TABLE_NAMES.MODELS,

  // 第3层：依赖第1-2层
  TABLE_NAMES.BOM_MATERIALS,
  TABLE_NAMES.PACKAGING_CONFIGS,

  // 第4层：依赖第3层
  TABLE_NAMES.PROCESS_CONFIGS,
  TABLE_NAMES.PACKAGING_MATERIALS,

  // 第5层：依赖第1-4层
  TABLE_NAMES.QUOTATIONS,
  TABLE_NAMES.STANDARD_COSTS,

  // 第6层：依赖第1层
  TABLE_NAMES.NOTIFICATIONS,

  // 第7层：系统配置
  TABLE_NAMES.SYSTEM_CONFIG,
];

/**
 * 枚举值映射（旧值 → 新值）
 */
export const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  // 用户状态映射
  status_boolean: {
    'true': 'active',
    'false': 'inactive',
    't': 'active',
    'f': 'inactive',
  },
  // 用户角色映射
  role: {
    admin: 'admin',
    purchaser: 'purchaser',
    producer: 'producer',
    reviewer: 'reviewer',
    sales: 'salesperson',
    readonly: 'readonly',
  },
  // 报价单状态映射
  quotation_status: {
    draft: 'draft',
    pending: 'submitted',
    approved: 'approved',
    rejected: 'rejected',
  },
  // 销售类型映射
  sale_type: {
    domestic: 'domestic',
    export: 'export',
    Domestic: 'domestic',
    Export: 'export',
  },
  // 运输类型映射
  shipping_type: {
    fcl20: 'fcl20',
    fcl40: 'fcl40',
    lcl: 'lcl',
    FCL20: 'fcl20',
    FCL40: 'fcl40',
    LCL: 'lcl',
    'fcl_20': 'fcl20',  // 旧库格式带下划线
    'fcl_40': 'fcl40',  // 旧库格式带下划线
    'FCL_20': 'fcl20',
    'FCL_40': 'fcl40',
    air: 'lcl',         // 空运映射到 LCL
    sea: 'fcl20',       // 海运默认 20尺
    '': 'fcl20',        // 空值默认 fcl20
  },
  // 工序单位映射
  process_unit: {
    piece: 'piece',
    dozen: 'dozen',
    pcs: 'piece',
    set: 'piece',
    unit: 'piece',
  },
  // 通知类型映射
  notification_type: {
    price_change: 'price_change',
    material_delete: 'material_delete',
  },
  // 通知状态映射
  notification_status: {
    pending: 'pending',
    processed: 'processed',
    archived: 'archived',
  },
  // 法规状态映射
  regulation_status: {
    active: 'active',
    inactive: 'inactive',
    'true': 'active',
    'false': 'inactive',
  },
};

/**
 * 特殊字段转换函数
 */
export const SPECIAL_CONVERTERS = {
  /**
   * 转换布尔值为状态枚举
   */
  booleanToStatus: (value: any): string => {
    if (value === true || value === 'true' || value === 't' || value === 1) {
      return 'active';
    }
    return 'inactive';
  },

  /**
   * 转换calculation_type字段（JSONB格式）
   * 旧库是字符串，新库是 JSONB
   */
  calculation_type: (value: any): object | null => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { type: value };
      }
    }
    if (typeof value === 'object') {
      return value;
    }
    return null;
  },

  /**
   * 转换货币字段
   */
  currency: (value: string): string => {
    const validCurrencies = ['CNY', 'USD'];
    return validCurrencies.includes(value) ? value : 'CNY';
  },

  /**
   * 转换Decimal字段
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

  /**
   * 转换系统配置值
   * 旧库是文本，新库是 JSONB
   */
  systemConfigValue: (value: any): object => {
    if (!value) return { v: '' };
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return { v: '' };
      // 检查是否是有效的 JSON
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          return JSON.parse(trimmed);
        } catch {
          // 解析失败，作为字符串包装
          return { v: trimmed };
        }
      }
      // 普通字符串，包装为对象
      return { v: trimmed };
    }
    return { v: String(value) };
  },
};

/**
 * 默认值配置
 * 当旧库字段为空或不存在时使用的默认值
 */
export const DEFAULT_VALUES: Record<string, Record<string, any>> = {
  customers: {
    region: 'China',        // 默认区域
    note: null,
    sales_person_id: null,
  },
  models: {
    category: 'general',
    series: 'standard',
    image_url: null,
    calculation_type: null,
  },
  packaging_configs: {
    packaging_type: 'standard',
  },
  process_configs: {
    unit: 'piece',
  },
  packaging_materials: {
    box_length: null,
    box_width: null,
    box_height: null,
  },
  quotations: {
    material_cost: 0,
    packaging_cost: 0,
    process_cost: 0,
    shipping_cost: 0,
    admin_fee: 0,
    vat: 0,
    review_note: null,
  },
  standard_costs: {
    packaging_cost: 0,
    process_cost: 0,
    shipping_cost: 0,
    vat: 0,
    total_cost: 0,
  },
  system_config: {
    updated_by: null,
    updated_at: () => new Date().toISOString(), // 使用当前时间作为默认
  },
};

/**
 * 需要计算的字段
 * 这些字段的值不能直接从旧库复制，需要计算得出
 */
export const COMPUTED_FIELDS: Record<string, Record<string, (row: any) => any>> = {
  packaging_configs: {
    // per_box = pc_per_bag * bags_per_box
    per_box: (row: any): number => {
      const pcPerBag = parseInt(row.pc_per_bag) || 0;
      const bagsPerBox = parseInt(row.bags_per_box) || 0;
      return pcPerBag * bagsPerBox;
    },
    // per_carton = per_box * boxes_per_carton
    per_carton: (row: any): number => {
      const pcPerBag = parseInt(row.pc_per_bag) || 0;
      const bagsPerBox = parseInt(row.bags_per_box) || 0;
      const boxesPerCarton = parseInt(row.boxes_per_carton) || 0;
      return pcPerBag * bagsPerBox * boxesPerCarton;
    },
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
  batchSize: number;
  enableTransaction: boolean;
  skipOnError: boolean;
  dryRun: boolean;
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
