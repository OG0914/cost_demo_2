# 数据库Schema设计

> 本文档详细说明成本分析管理系统的数据库表结构，用于指导新架构的数据库设计。

---

## 一、数据库概述

### 1.1 数据库类型

- **数据库**：PostgreSQL
- **字符集**：UTF-8
- **时区**：Asia/Shanghai

### 1.2 命名规范

- **表名**：小写，下划线分隔（如 `quotation_items`）
- **字段名**：小写，下划线分隔（如 `created_at`）
- **主键**：统一使用 `id`（自增）
- **外键**：`表名_id`（如 `quotation_id`）
- **时间戳**：统一使用 `created_at` 和 `updated_at`

### 1.3 表分类

| 分类 | 表名 | 说明 |
|------|------|------|
| 用户权限 | users, roles, permissions, role_permissions | 用户认证和权限管理 |
| 成本分析 | quotations, quotation_items, review_history | 成本分析核心数据 |
| 基础数据 | materials, models, regulations, customers | 基础数据管理 |
| 包装配置 | packaging_configs, packaging_processes, packaging_materials | 包装配置管理 |
| 系统配置 | system_configs, calculation_rules | 系统参数配置 |
| 通知 | notifications, user_notifications | 通知中心 |

---

## 二、用户权限模块

### 2.1 users（用户表）

**用途**：存储系统用户信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 加密密码 |
| real_name | VARCHAR(100) | - | 真实姓名 |
| email | VARCHAR(100) | - | 邮箱 |
| phone | VARCHAR(20) | - | 电话 |
| role_code | VARCHAR(50) | NOT NULL | 角色代码 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| avatar | VARCHAR(255) | - | 头像URL |
| last_login_at | TIMESTAMP | - | 最后登录时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_users_username (username)
- INDEX idx_users_role (role_code)
- INDEX idx_users_status (status)

### 2.2 roles（角色表）

**用途**：存储角色定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 角色ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 角色代码 |
| name | VARCHAR(100) | NOT NULL | 角色名称 |
| description | TEXT | - | 角色描述 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_roles_code (code)

**默认角色**：
- admin：管理员
- reviewer：审核员
- salesperson：业务员
- purchaser：采购员
- producer：生产人员
- readonly：只读用户

### 2.3 permissions（权限表）

**用途**：存储权限定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 权限ID |
| code | VARCHAR(100) | UNIQUE, NOT NULL | 权限代码 |
| label | VARCHAR(100) | NOT NULL | 权限标签 |
| module | VARCHAR(50) | NOT NULL | 所属模块 |
| description | TEXT | - | 权限描述 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_permissions_code (code)
- INDEX idx_permissions_module (module)

### 2.4 role_permissions（角色权限关联表）

**用途**：存储角色与权限的关联关系

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | ID |
| role_code | VARCHAR(50) | NOT NULL | 角色代码 |
| permission_code | VARCHAR(100) | NOT NULL | 权限代码 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**约束**：
- UNIQUE(role_code, permission_code)
- FOREIGN KEY (role_code) REFERENCES roles(code)
- FOREIGN KEY (permission_code) REFERENCES permissions(code)

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_role_permissions_unique (role_code, permission_code)
- INDEX idx_role_permissions_role (role_code)
- INDEX idx_role_permissions_permission (permission_code)

---

## 三、成本分析模块

### 3.1 quotations（成本分析主表）

**用途**：存储成本分析基本信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 成本分析ID |
| quotation_no | VARCHAR(50) | UNIQUE, NOT NULL | 成本分析编号 |
| status | VARCHAR(20) | DEFAULT 'draft' | 状态：draft/submitted/approved/rejected |
| sales_type | VARCHAR(20) | NOT NULL | 销售类型：domestic/export |
| customer_id | INTEGER | REFERENCES customers(id) | 客户ID |
| customer_name | VARCHAR(100) | - | 客户名称（冗余） |
| customer_region | VARCHAR(100) | - | 客户地区 |
| model_id | INTEGER | NOT NULL, REFERENCES models(id) | 型号ID |
| model_name | VARCHAR(100) | - | 型号名称（冗余） |
| regulation_id | INTEGER | REFERENCES regulations(id) | 法规ID |
| regulation_name | VARCHAR(100) | - | 法规名称（冗余） |
| packaging_config_id | INTEGER | REFERENCES packaging_configs(id) | 包装配置ID |
| packaging_config_name | VARCHAR(100) | - | 包装配置名称（冗余） |
| quantity | INTEGER | NOT NULL | 订单数量 |
| unit | VARCHAR(20) | DEFAULT 'piece' | 单位：piece/box |
| is_estimation | BOOLEAN | DEFAULT FALSE | 是否为预估模式 |
| reference_standard_cost_id | INTEGER | REFERENCES standard_costs(id) | 参考标准成本ID |
| base_cost | DECIMAL(12,4) | - | 基础成本 |
| overhead_rate | DECIMAL(5,2) | DEFAULT 20.00 | 管销率 |
| overhead_price | DECIMAL(12,4) | - | 管销价 |
| final_price | DECIMAL(12,4) | - | 最终价格 |
| vat_rate | DECIMAL(5,2) | DEFAULT 13.00 | 增值税率 |
| exchange_rate | DECIMAL(8,4) | DEFAULT 7.2000 | 汇率 |
| insurance_rate | DECIMAL(5,2) | DEFAULT 0.30 | 保险率 |
| freight_cost | DECIMAL(12,4) | DEFAULT 0 | 运费成本 |
| freight_included | BOOLEAN | DEFAULT FALSE | 运费是否计入基础成本 |
| creator_id | INTEGER | NOT NULL, REFERENCES users(id) | 创建人ID |
| creator_name | VARCHAR(100) | - | 创建人姓名（冗余） |
| reviewer_id | INTEGER | REFERENCES users(id) | 审核人ID |
| reviewer_name | VARCHAR(100) | - | 审核人姓名（冗余） |
| reviewed_at | TIMESTAMP | - | 审核时间 |
| reject_reason | TEXT | - | 退回原因 |
| submit_count | INTEGER | DEFAULT 0 | 提交次数 |
| version | INTEGER | DEFAULT 1 | 版本号 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_quotations_no (quotation_no)
- INDEX idx_quotations_status (status)
- INDEX idx_quotations_customer (customer_id)
- INDEX idx_quotations_model (model_id)
- INDEX idx_quotations_creator (creator_id)
- INDEX idx_quotations_created_at (created_at DESC)
- INDEX idx_quotations_sales_type (sales_type)

### 3.2 quotation_items（成本分析明细表）

**用途**：存储成本分析的原料、工序、包材明细

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 明细ID |
| quotation_id | INTEGER | NOT NULL, REFERENCES quotations(id) ON DELETE CASCADE | 成本分析ID |
| item_type | VARCHAR(20) | NOT NULL | 类型：material/process/packaging |
| item_id | INTEGER | - | 关联的基础数据ID |
| name | VARCHAR(100) | NOT NULL | 名称 |
| code | VARCHAR(50) | - | 品号/编号 |
| unit_price | DECIMAL(12,4) | NOT NULL | 单价 |
| quantity | DECIMAL(12,4) | NOT NULL | 数量/用量 |
| unit | VARCHAR(20) | - | 单位 |
| subtotal | DECIMAL(12,4) | NOT NULL | 小计 |
| coefficient | DECIMAL(5,2) | - | 计算系数 |
| calculation_type | VARCHAR(20) | - | 计算类型：multiply/divide |
| is_post_overhead | BOOLEAN | DEFAULT FALSE | 是否为管销后原料 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**约束**：
- FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE

**索引**：
- PRIMARY KEY (id)
- INDEX idx_quotation_items_quotation (quotation_id)
- INDEX idx_quotation_items_type (item_type)
- INDEX idx_quotation_items_item (item_id)

### 3.3 review_history（审核历史表）

**用途**：存储成本分析的审核历史记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 历史ID |
| quotation_id | INTEGER | NOT NULL, REFERENCES quotations(id) ON DELETE CASCADE | 成本分析ID |
| action | VARCHAR(20) | NOT NULL | 动作：created/submitted/approved/rejected/resubmitted |
| operator_id | INTEGER | NOT NULL, REFERENCES users(id) | 操作人ID |
| operator_name | VARCHAR(100) | - | 操作人姓名（冗余） |
| comment | TEXT | - | 批注 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
- FOREIGN KEY (operator_id) REFERENCES users(id)
- CHECK (action IN ('created', 'submitted', 'approved', 'rejected', 'resubmitted'))

**索引**：
- PRIMARY KEY (id)
- INDEX idx_review_history_quotation (quotation_id)
- INDEX idx_review_history_action (action)
- INDEX idx_review_history_created (created_at DESC)

### 3.4 custom_fees（自定义费用表）

**用途**：存储成本分析的自定义费用项

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 费用ID |
| quotation_id | INTEGER | NOT NULL, REFERENCES quotations(id) ON DELETE CASCADE | 成本分析ID |
| name | VARCHAR(100) | NOT NULL | 费用名称 |
| rate | DECIMAL(5,2) | NOT NULL | 费率（百分比） |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE

**索引**：
- PRIMARY KEY (id)
- INDEX idx_custom_fees_quotation (quotation_id)

### 3.5 profit_tiers（利润档位表）

**用途**：存储成本分析的利润档位

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 档位ID |
| quotation_id | INTEGER | NOT NULL, REFERENCES quotations(id) ON DELETE CASCADE | 成本分析ID |
| rate | DECIMAL(5,2) | NOT NULL | 利润率（百分比） |
| price | DECIMAL(12,4) | - | 计算后的价格 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否为系统默认档位 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE

**索引**：
- PRIMARY KEY (id)
- INDEX idx_profit_tiers_quotation (quotation_id)

---

## 四、基础数据模块

### 4.1 materials（原料表）

**用途**：存储原料基础数据

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 原料ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 品号 |
| name | VARCHAR(100) | NOT NULL | 原料名称 |
| category | VARCHAR(50) | - | 品名类别：material/packaging |
| subcategory | VARCHAR(100) | - | 子分类 |
| material_type | VARCHAR(20) | DEFAULT 'general' | 原料类型：half_mask/general |
| unit_price | DECIMAL(12,4) | NOT NULL | 单价 |
| currency | VARCHAR(3) | DEFAULT 'CNY' | 币别 |
| unit | VARCHAR(20) | NOT NULL | 单位 |
| supplier | VARCHAR(100) | - | 供应商 |
| manufacturer | VARCHAR(100) | - | 厂商 |
| product_desc | TEXT | - | 产品描述 |
| packaging_mode | VARCHAR(50) | - | 包装方式 |
| moq | INTEGER | - | 最小起订量 |
| production_cycle | INTEGER | - | 生产周期（天） |
| remark | TEXT | - | 备注 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_materials_code (code)
- INDEX idx_materials_category (category)
- INDEX idx_materials_type (material_type)
- INDEX idx_materials_subcategory (subcategory)
- INDEX idx_materials_status (status)

### 4.2 models（型号表）

**用途**：存储产品型号信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 型号ID |
| name | VARCHAR(100) | NOT NULL | 型号名称 |
| regulation_id | INTEGER | REFERENCES regulations(id) | 法规ID |
| series | VARCHAR(100) | - | 产品系列 |
| category | VARCHAR(50) | - | 型号分类：mask/half_mask/full_mask/ppe |
| calculation_type | VARCHAR(20) | - | 计算类型：body/accessory/filter_box/filter_cotton/filter_cake |
| images | JSONB | - | 图片数组 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_models_regulation (regulation_id)
- INDEX idx_models_category (category)
- INDEX idx_models_status (status)

### 4.3 model_boms（型号BOM表）

**用途**：存储型号与原料的BOM关系

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | BOM ID |
| model_id | INTEGER | NOT NULL, REFERENCES models(id) ON DELETE CASCADE | 型号ID |
| material_id | INTEGER | NOT NULL, REFERENCES materials(id) | 原料ID |
| quantity | DECIMAL(12,4) | NOT NULL | 用量 |
| unit | VARCHAR(20) | - | 单位 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
- FOREIGN KEY (material_id) REFERENCES materials(id)
- UNIQUE(model_id, material_id)

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_model_boms_unique (model_id, material_id)
- INDEX idx_model_boms_model (model_id)
- INDEX idx_model_boms_material (material_id)

### 4.4 regulations（法规表）

**用途**：存储法规标准信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 法规ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 法规代码 |
| name | VARCHAR(100) | NOT NULL | 法规名称 |
| description | TEXT | - | 描述 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_regulations_code (code)
- INDEX idx_regulations_status (status)

### 4.5 customers（客户表）

**用途**：存储客户信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 客户ID |
| vc_code | VARCHAR(50) | UNIQUE, NOT NULL | VC编码 |
| name | VARCHAR(100) | NOT NULL | 客户名称 |
| region | VARCHAR(100) | - | 所属地区 |
| remark | TEXT | - | 备注 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_customers_vc_code (vc_code)
- INDEX idx_customers_name (name)

---

## 五、包装配置模块

### 5.1 packaging_configs（包装配置表）

**用途**：存储包装配置信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 配置ID |
| model_id | INTEGER | NOT NULL, REFERENCES models(id) | 型号ID |
| name | VARCHAR(100) | NOT NULL | 配置名称 |
| factory | VARCHAR(50) | NOT NULL | 生产工厂：dongguan/hubei |
| packaging_type | VARCHAR(20) | DEFAULT 'standard_box' | 包装类型 |
| layer1_qty | INTEGER | - | 第一层数量 |
| layer2_qty | INTEGER | - | 第二层数量 |
| layer3_qty | INTEGER | - | 第三层数量 |
| carton_length | DECIMAL(8,2) | - | 外箱长（cm） |
| carton_width | DECIMAL(8,2) | - | 外箱宽（cm） |
| carton_height | DECIMAL(8,2) | - | 外箱高（cm） |
| cbm | DECIMAL(10,6) | - | 体积（立方米） |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**约束**：
- FOREIGN KEY (model_id) REFERENCES models(id)
- UNIQUE(model_id, name)

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_packaging_configs_unique (model_id, name)
- INDEX idx_packaging_configs_model (model_id)
- INDEX idx_packaging_configs_type (packaging_type)
- INDEX idx_packaging_configs_status (status)

### 5.2 packaging_processes（包装工序关联表）

**用途**：存储包装配置与工序的关联

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | ID |
| packaging_config_id | INTEGER | NOT NULL, REFERENCES packaging_configs(id) ON DELETE CASCADE | 包装配置ID |
| process_id | INTEGER | NOT NULL, REFERENCES processes(id) | 工序ID |
| quantity | DECIMAL(12,4) | DEFAULT 1 | 数量 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
- FOREIGN KEY (process_id) REFERENCES processes(id)

**索引**：
- PRIMARY KEY (id)
- INDEX idx_packaging_processes_config (packaging_config_id)
- INDEX idx_packaging_processes_process (process_id)

### 5.3 packaging_materials（包装包材关联表）

**用途**：存储包装配置与包材的关联

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | ID |
| packaging_config_id | INTEGER | NOT NULL, REFERENCES packaging_configs(id) ON DELETE CASCADE | 包装配置ID |
| material_id | INTEGER | NOT NULL, REFERENCES materials(id) | 包材ID |
| quantity | DECIMAL(12,4) | DEFAULT 1 | 用量 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (packaging_config_id) REFERENCES packaging_configs(id) ON DELETE CASCADE
- FOREIGN KEY (material_id) REFERENCES materials(id)

**索引**：
- PRIMARY KEY (id)
- INDEX idx_packaging_materials_config (packaging_config_id)
- INDEX idx_packaging_materials_material (material_id)

### 5.4 processes（工序表）

**用途**：存储工序基础数据

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 工序ID |
| category | VARCHAR(50) | - | 工序分类 |
| name | VARCHAR(100) | NOT NULL | 工序名称 |
| unit_price | DECIMAL(12,4) | NOT NULL | 工序单价 |
| unit | VARCHAR(20) | NOT NULL | 单位 |
| remark | TEXT | - | 备注 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态：active/disabled |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_processes_category (category)
- INDEX idx_processes_status (status)

---

## 六、系统配置模块

### 6.1 system_configs（系统配置表）

**用途**：存储系统参数配置

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 配置ID |
| config_key | VARCHAR(100) | UNIQUE, NOT NULL | 配置键 |
| config_value | TEXT | - | 配置值 |
| config_type | VARCHAR(20) | DEFAULT 'string' | 值类型：string/number/boolean/json |
| description | TEXT | - | 配置说明 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_system_configs_key (config_key)

**默认配置项**：

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| mask_coefficient | 0.97 | 口罩类系数 |
| half_mask_coefficient | 0.99 | 半面罩类系数 |
| labor_coefficient | 1.56 | 工价系数 |
| overhead_rate | 0.20 | 管销率 |
| vat_rate | 0.13 | 增值税率 |
| exchange_rate | 7.2 | 汇率 |
| insurance_rate | 0.003 | 保险率 |

### 6.2 calculation_rules（计算规则表）

**用途**：存储原料计算规则

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 规则ID |
| model_category | VARCHAR(50) | NOT NULL | 型号分类 |
| calculation_type | VARCHAR(50) | NOT NULL | 计算类型 |
| formula | VARCHAR(20) | NOT NULL | 公式：multiply/divide |
| coefficient | DECIMAL(5,2) | NOT NULL | 系数 |
| description | TEXT | - | 说明 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_calc_rules_unique (model_category, calculation_type)

**默认规则**：

| 型号分类 | 计算类型 | 公式 | 系数 |
|---------|---------|------|------|
| mask | body | multiply | 0.97 |
| mask | accessory | multiply | 0.97 |
| half_mask | body | multiply | 0.99 |
| half_mask | accessory | multiply | 0.99 |
| half_mask | filter_box | divide | 0.99 |
| half_mask | filter_cotton | divide | 0.99 |
| half_mask | filter_cake | divide | 0.99 |

---

## 七、通知模块

### 7.1 notifications（通知表）

**用途**：存储系统通知

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 通知ID |
| type | VARCHAR(50) | NOT NULL | 类型：review/price/system |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | TEXT | - | 内容 |
| target_id | INTEGER | - | 关联目标ID |
| target_type | VARCHAR(50) | - | 关联目标类型 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_notifications_type (type)
- INDEX idx_notifications_created (created_at DESC)

### 7.2 user_notifications（用户通知关联表）

**用途**：存储用户与通知的关联（已读状态）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | ID |
| user_id | INTEGER | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 用户ID |
| notification_id | INTEGER | NOT NULL, REFERENCES notifications(id) ON DELETE CASCADE | 通知ID |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| read_at | TIMESTAMP | - | 阅读时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**约束**：
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
- UNIQUE(user_id, notification_id)

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_user_notifications_unique (user_id, notification_id)
- INDEX idx_user_notifications_user (user_id)
- INDEX idx_user_notifications_unread (user_id, is_read)

---

## 八、表关系图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │     roles       │     │  permissions    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ code (PK)       │     │ id (PK)         │
│ username (UQ)   │     │ name            │◄────┤ code (UQ)       │
│ role_code (FK)  │     │ description     │     │ label           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       ▲                       ▲
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ role_permissions│──────────────┘
         │              ├─────────────────┤
         │              │ role_code (FK)  │
         │              │ permission_code │
         │              └─────────────────┘
         │
         │              ┌─────────────────┐
         └─────────────►│   quotations    │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ quotation_no(UQ)│
                        │ customer_id(FK) │◄──────────────┐
                        │ model_id (FK)   │◄───┐          │
                        │ creator_id (FK) │────┘          │
                        │ reviewer_id(FK) │◄───┐          │
                        └─────────────────┘    │          │
                                 │              │          │
                                 │              │          │
                    ┌────────────┼────────────┐│          │
                    │            │            ││          │
                    ▼            ▼            ▼│          │
           ┌─────────────┐ ┌──────────┐ ┌──────────┐     │
           │quotation_   │ │ custom_  │ │ profit_  │     │
           │items        │ │ fees     │ │ tiers    │     │
           └─────────────┘ └──────────┘ └──────────┘     │
                                                         │
                        ┌─────────────────┐              │
                        │   customers     │◄─────────────┘
                        ├─────────────────┤
                        │ id (PK)         │
                        │ vc_code (UQ)    │
                        │ name            │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     models      │◄────┤ packaging_      │     │   processes     │
├─────────────────┤     │ configs         │     ├─────────────────┤
│ id (PK)         │     ├─────────────────┤     │ id (PK)         │
│ regulation_id   │◄───┐│ id (PK)         │     │ category        │
│ name            │    ││ model_id (FK)   │     │ name            │
│ category        │    ││ name            │     │ unit_price      │
└─────────────────┘    ││ packaging_type  │     └─────────────────┘
         ▲             ││ layer1-3_qty    │              ▲
         │             ││ cbm             │              │
         │             │└─────────────────┘              │
         │             │         │                       │
         │             │         │                       │
         │             │    ┌────┴────┐                  │
         │             │    │         │                  │
         │             │    ▼         ▼                  │
         │             │ ┌────────┐ ┌────────┐           │
         │             │ │packaging│ │packaging│           │
         │             │ │processes│ │materials│◄──────────┘
         │             │ └────────┘ └────────┘
         │             │
         │             │     ┌─────────────────┐
         │             └────►│    materials    │
         │                   ├─────────────────┤
         │                   │ id (PK)         │
         └───────────────────┤ code (UQ)       │
                             │ category        │
                             │ material_type   │
                             └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  regulations    │     │   model_boms    │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ code (UQ)       │     │ model_id (FK)   │
│ name            │     │ material_id(FK) │
└─────────────────┘     │ quantity        │
                        └─────────────────┘
```

---

## 九、关键索引说明

### 9.1 唯一索引

| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| users | idx_users_username | username | 用户名唯一 |
| roles | idx_roles_code | code | 角色代码唯一 |
| permissions | idx_permissions_code | code | 权限代码唯一 |
| role_permissions | idx_role_permissions_unique | role_code, permission_code | 角色权限组合唯一 |
| quotations | idx_quotations_no | quotation_no | 成本分析编号唯一 |
| materials | idx_materials_code | code | 品号唯一 |
| regulations | idx_regulations_code | code | 法规代码唯一 |
| customers | idx_customers_vc_code | vc_code | VC编码唯一 |
| packaging_configs | idx_packaging_configs_unique | model_id, name | 型号下配置名称唯一 |
| model_boms | idx_model_boms_unique | model_id, material_id | 型号原料组合唯一 |
| calculation_rules | idx_calc_rules_unique | model_category, calculation_type | 规则组合唯一 |
| system_configs | idx_system_configs_key | config_key | 配置键唯一 |
| user_notifications | idx_user_notifications_unique | user_id, notification_id | 用户通知组合唯一 |

### 9.2 性能索引

| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| quotations | idx_quotations_status | status | 状态查询 |
| quotations | idx_quotations_customer | customer_id | 客户查询 |
| quotations | idx_quotations_model | model_id | 型号查询 |
| quotations | idx_quotations_creator | creator_id | 创建人查询 |
| quotations | idx_quotations_created_at | created_at DESC | 时间排序 |
| quotation_items | idx_quotation_items_quotation | quotation_id | 成本分析明细查询 |
| review_history | idx_review_history_quotation | quotation_id | 审核历史查询 |
| review_history | idx_review_history_created | created_at DESC | 时间排序 |
| materials | idx_materials_category | category | 分类查询 |
| materials | idx_materials_type | material_type | 类型查询 |
| materials | idx_materials_subcategory | subcategory | 子分类查询 |
| notifications | idx_notifications_type | type | 类型查询 |
| user_notifications | idx_user_notifications_unread | user_id, is_read | 未读通知查询 |

---

## 十、外键关联与级联规则

### 10.1 级联删除（ON DELETE CASCADE）

| 子表 | 父表 | 外键字段 | 级联行为 |
|------|------|---------|---------|
| quotation_items | quotations | quotation_id | CASCADE |
| review_history | quotations | quotation_id | CASCADE |
| custom_fees | quotations | quotation_id | CASCADE |
| profit_tiers | quotations | quotation_id | CASCADE |
| packaging_processes | packaging_configs | packaging_config_id | CASCADE |
| packaging_materials | packaging_configs | packaging_config_id | CASCADE |
| model_boms | models | model_id | CASCADE |
| user_notifications | users | user_id | CASCADE |
| user_notifications | notifications | notification_id | CASCADE |

### 10.2 限制删除（ON DELETE RESTRICT）

| 子表 | 父表 | 外键字段 | 级联行为 |
|------|------|---------|---------|
| quotations | customers | customer_id | RESTRICT |
| quotations | models | model_id | RESTRICT |
| quotations | regulations | regulation_id | RESTRICT |
| quotations | packaging_configs | packaging_config_id | RESTRICT |
| quotations | users | creator_id | RESTRICT |
| quotations | users | reviewer_id | RESTRICT |
| packaging_configs | models | model_id | RESTRICT |
| model_boms | materials | material_id | RESTRICT |
| packaging_processes | processes | process_id | RESTRICT |
| packaging_materials | materials | material_id | RESTRICT |

---

*文档版本: 1.0*
*最后更新: 2026-03-09*
