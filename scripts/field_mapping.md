# 旧数据库字段映射文档

> 数据库: cost_analysis
> 生成时间: 2026-03-12T06:27:34.520Z

## 表列表

| 表名 | 记录数 |
|------|--------|
| comments | 4 |
| customers | 16 |
| material_price_changes | 3 |
| materials | 50 |
| migrations | 24 |
| model_bom_materials | 90 |
| model_images | 4 |
| models | 23 |
| notifications | 0 |
| packaging | 0 |
| packaging_configs | 63 |
| packaging_materials | 92 |
| permission_history | 2 |
| permissions | 28 |
| price_history | 16 |
| process_config_history | 8 |
| process_configs | 322 |
| processes | 0 |
| quotation_custom_fees | 0 |
| quotation_items | 559 |
| quotations | 29 |
| regulations | 3 |
| review_history | 12 |
| role_permissions | 51 |
| roles | 6 |
| standard_cost_updates | 0 |
| standard_costs | 1 |
| system_config | 34 |
| user_notifications | 0 |
| users | 8 |

## 核心表字段详情

### users

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('users_id_seq'::regclass) |
| username | character varying(100) | 100 | NO | - |
| password | character varying(255) | 255 | NO | - |
| role | character varying(20) | 20 | NO | - |
| real_name | character varying(100) | 100 | YES | - |
| email | character varying(255) | 255 | YES | - |
| is_active | boolean | - | YES | true |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |

### roles

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('roles_id_seq'::regclass) |
| code | character varying(50) | 50 | NO | - |
| name | character varying(100) | 100 | NO | - |
| description | text | - | YES | - |
| icon | character varying(50) | 50 | YES | 'ri-user-line'::character varying |
| is_system | boolean | - | YES | false |
| is_active | boolean | - | YES | true |
| sort_order | integer(32,0) | 32 | YES | 0 |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |

### materials

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('materials_id_seq'::regclass) |
| item_no | character varying(100) | 100 | NO | - |
| name | character varying(200) | 200 | NO | - |
| unit | character varying(50) | 50 | NO | - |
| price | numeric(12,4) | 12 | NO | - |
| currency | character varying(10) | 10 | NO | 'CNY'::character varying |
| manufacturer | character varying(200) | 200 | YES | - |
| usage_amount | numeric(12,6) | 12 | YES | - |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |
| category | character varying(50) | 50 | YES | - |
| deleted_at | timestamp without time zone | - | YES | - |
| material_type | character varying(20) | 20 | YES | 'general'::character varying |
| subcategory | character varying(100) | 100 | YES | - |
| product_desc | text | - | YES | - |
| packaging_mode | character varying(50) | 50 | YES | - |
| supplier | character varying(100) | 100 | YES | - |
| production_date | date | - | YES | - |
| moq | integer(32,0) | 32 | YES | - |
| remark | text | - | YES | - |
| production_cycle | character varying(50) | 50 | YES | - |

### models

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('models_id_seq'::regclass) |
| regulation_id | integer(32,0) | 32 | NO | - |
| model_name | character varying(200) | 200 | NO | - |
| model_category | character varying(100) | 100 | YES | - |
| is_active | boolean | - | YES | true |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |
| model_series | character varying(50) | 50 | YES | - |
| calculation_type | character varying(20) | 20 | YES | - |

### quotations

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('quotations_id_seq'::regclass) |
| quotation_no | character varying(50) | 50 | NO | - |
| customer_name | character varying(200) | 200 | NO | - |
| customer_region | character varying(100) | 100 | NO | - |
| model_id | integer(32,0) | 32 | NO | - |
| regulation_id | integer(32,0) | 32 | NO | - |
| quantity | integer(32,0) | 32 | NO | - |
| freight_total | numeric(12,4) | 12 | NO | - |
| freight_per_unit | numeric(12,4) | 12 | NO | - |
| sales_type | character varying(20) | 20 | NO | - |
| shipping_method | character varying(20) | 20 | YES | - |
| port | character varying(100) | 100 | YES | - |
| base_cost | numeric(12,4) | 12 | NO | - |
| overhead_price | numeric(12,4) | 12 | NO | - |
| final_price | numeric(12,4) | 12 | NO | - |
| currency | character varying(10) | 10 | NO | 'CNY'::character varying |
| status | character varying(20) | 20 | NO | 'draft'::character varying |
| created_by | integer(32,0) | 32 | NO | - |
| reviewed_by | integer(32,0) | 32 | YES | - |
| packaging_config_id | integer(32,0) | 32 | YES | - |
| include_freight_in_base | boolean | - | YES | true |
| custom_profit_tiers | text | - | YES | - |
| vat_rate | numeric(5,4) | 5 | YES | - |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |
| submitted_at | timestamp without time zone | - | YES | - |
| reviewed_at | timestamp without time zone | - | YES | - |
| customer_id | integer(32,0) | 32 | YES | - |
| batch_id | character varying(50) | 50 | YES | - |
| batch_remark | character varying(200) | 200 | YES | - |
| source_standard_cost_id | integer(32,0) | 32 | YES | - |
| is_estimation | boolean | - | YES | false |
| reference_standard_cost_id | integer(32,0) | 32 | YES | - |
| deleted_at | timestamp without time zone | - | YES | - |

### quotation_items

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('quotation_items_id_seq'::regclass) |
| quotation_id | integer(32,0) | 32 | NO | - |
| category | character varying(20) | 20 | NO | - |
| item_name | character varying(200) | 200 | NO | - |
| usage_amount | numeric(12,6) | 12 | NO | - |
| unit_price | numeric(12,4) | 12 | NO | - |
| subtotal | numeric(12,4) | 12 | NO | - |
| is_changed | boolean | - | YES | false |
| original_value | numeric(12,4) | 12 | YES | - |
| material_id | integer(32,0) | 32 | YES | - |
| after_overhead | boolean | - | YES | false |
| created_at | timestamp without time zone | - | YES | now() |

### customers

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('customers_id_seq'::regclass) |
| vc_code | character varying(50) | 50 | NO | - |
| name | character varying(100) | 100 | NO | - |
| region | character varying(100) | 100 | YES | - |
| remark | text | - | YES | - |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |
| user_id | integer(32,0) | 32 | YES | - |

### regulations

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('regulations_id_seq'::regclass) |
| name | character varying(100) | 100 | NO | - |
| description | text | - | YES | - |
| is_active | boolean | - | YES | true |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |

### packaging_configs

| 字段名 | 数据类型 | 长度/精度 | 可空 | 默认值 |
|--------|----------|-----------|------|--------|
| id | integer(32,0) | 32 | NO | nextval('packaging_configs_id_seq'::regclass) |
| model_id | integer(32,0) | 32 | NO | - |
| config_name | character varying(200) | 200 | NO | - |
| pc_per_bag | integer(32,0) | 32 | NO | - |
| bags_per_box | integer(32,0) | 32 | NO | - |
| boxes_per_carton | integer(32,0) | 32 | NO | - |
| is_active | boolean | - | YES | true |
| created_at | timestamp without time zone | - | YES | now() |
| updated_at | timestamp without time zone | - | YES | now() |
| packaging_type | character varying(20) | 20 | NO | 'standard_box'::character varying |
| layer1_qty | integer(32,0) | 32 | NO | - |
| layer2_qty | integer(32,0) | 32 | NO | - |
| layer3_qty | integer(32,0) | 32 | YES | - |
| factory | character varying(50) | 50 | YES | 'dongguan_xunan'::character varying |
| last_modified_by | integer(32,0) | 32 | YES | - |
| last_process_total | numeric(12,4) | 12 | YES | - |

## 外键约束

| 表名 | 字段 | 引用表 | 引用字段 | 约束名 |
|------|------|--------|----------|--------|
| comments | user_id | users | id | comments_user_id_fkey |
| comments | quotation_id | quotations | id | comments_quotation_id_fkey |
| customers | user_id | users | id | customers_user_id_fkey |
| material_price_changes | changed_by | users | id | material_price_changes_changed_by_fkey |
| material_price_changes | material_id | materials | id | material_price_changes_material_id_fkey |
| model_bom_materials | material_id | materials | id | model_bom_materials_material_id_fkey |
| model_bom_materials | model_id | models | id | model_bom_materials_model_id_fkey |
| model_images | model_id | models | id | model_images_model_id_fkey |
| models | regulation_id | regulations | id | models_regulation_id_fkey |
| notifications | standard_cost_id | standard_costs | id | notifications_standard_cost_id_fkey |
| notifications | user_id | users | id | notifications_user_id_fkey |
| notifications | model_id | models | id | notifications_model_id_fkey |
| notifications | material_id | materials | id | notifications_material_id_fkey |
| notifications | quotation_id | quotations | id | notifications_quotation_id_fkey |
| notifications | price_change_id | material_price_changes | id | notifications_price_change_id_fkey |
| packaging | model_id | models | id | packaging_model_id_fkey |
| packaging_configs | last_modified_by | users | id | packaging_configs_last_modified_by_fkey |
| packaging_configs | model_id | models | id | packaging_configs_model_id_fkey |
| packaging_materials | packaging_config_id | packaging_configs | id | packaging_materials_packaging_config_id_fkey |
| price_history | changed_by | users | id | price_history_changed_by_fkey |
| process_config_history | packaging_config_id | packaging_configs | id | process_config_history_packaging_config_id_fkey |
| process_config_history | process_id | process_configs | id | process_config_history_process_id_fkey |
| process_config_history | operated_by | users | id | process_config_history_operated_by_fkey |
| process_configs | packaging_config_id | packaging_configs | id | process_configs_packaging_config_id_fkey |
| processes | model_id | models | id | processes_model_id_fkey |
| quotation_custom_fees | quotation_id | quotations | id | quotation_custom_fees_quotation_id_fkey |
| quotation_items | quotation_id | quotations | id | quotation_items_quotation_id_fkey |
| quotation_items | material_id | materials | id | quotation_items_material_id_fkey |
| quotations | reference_standard_cost_id | standard_costs | id | quotations_reference_standard_cost_id_fkey |
| quotations | customer_id | customers | id | quotations_customer_id_fkey |
| quotations | packaging_config_id | packaging_configs | id | quotations_packaging_config_id_fkey |
| quotations | reviewed_by | users | id | quotations_reviewed_by_fkey |
| quotations | created_by | users | id | quotations_created_by_fkey |
| quotations | regulation_id | regulations | id | quotations_regulation_id_fkey |
| quotations | model_id | models | id | quotations_model_id_fkey |
| review_history | quotation_id | quotations | id | review_history_quotation_id_fkey |
| review_history | operator_id | users | id | review_history_operator_id_fkey |
| standard_cost_updates | reviewed_by | users | id | standard_cost_updates_reviewed_by_fkey |
| standard_cost_updates | standard_cost_id | standard_costs | id | standard_cost_updates_standard_cost_id_fkey |
| standard_costs | packaging_config_id | packaging_configs | id | standard_costs_packaging_config_id_fkey |
| standard_costs | quotation_id | quotations | id | standard_costs_quotation_id_fkey |
| standard_costs | set_by | users | id | standard_costs_set_by_fkey |
| user_notifications | user_id | users | id | user_notifications_user_id_fkey |
| user_notifications | notification_id | notifications | id | user_notifications_notification_id_fkey |

## 索引列表

| 表名 | 索引名 | 定义 |
|------|--------|------|
| comments | comments_pkey | UNIQUE INDEX comments_pkey ON public.comments USING btree (id)... |
| comments | idx_comments_quotation_id | INDEX idx_comments_quotation_id ON public.comments USING btree (quotation_id)... |
| customers | customers_pkey | UNIQUE INDEX customers_pkey ON public.customers USING btree (id)... |
| customers | customers_vc_code_key | UNIQUE INDEX customers_vc_code_key ON public.customers USING btree (vc_code)... |
| customers | idx_customers_name | INDEX idx_customers_name ON public.customers USING btree (name)... |
| customers | idx_customers_user_id | INDEX idx_customers_user_id ON public.customers USING btree (user_id)... |
| customers | idx_customers_vc_code | INDEX idx_customers_vc_code ON public.customers USING btree (vc_code)... |
| material_price_changes | idx_price_changes_changed_at | INDEX idx_price_changes_changed_at ON public.material_price_changes USING btree ... |
| material_price_changes | idx_price_changes_material_id | INDEX idx_price_changes_material_id ON public.material_price_changes USING btree... |
| material_price_changes | material_price_changes_pkey | UNIQUE INDEX material_price_changes_pkey ON public.material_price_changes USING ... |
| materials | idx_materials_category | INDEX idx_materials_category ON public.materials USING btree (category)... |
| materials | idx_materials_deleted | INDEX idx_materials_deleted ON public.materials USING btree (deleted_at) WHERE (... |
| materials | idx_materials_item_no | INDEX idx_materials_item_no ON public.materials USING btree (item_no)... |
| materials | idx_materials_manufacturer | INDEX idx_materials_manufacturer ON public.materials USING btree (manufacturer)... |
| materials | idx_materials_production_cycle | INDEX idx_materials_production_cycle ON public.materials USING btree (production... |
| materials | idx_materials_subcategory | INDEX idx_materials_subcategory ON public.materials USING btree (subcategory)... |
| materials | idx_materials_type | INDEX idx_materials_type ON public.materials USING btree (material_type)... |
| materials | idx_materials_type_subcategory | INDEX idx_materials_type_subcategory ON public.materials USING btree (material_t... |
| materials | materials_item_no_key | UNIQUE INDEX materials_item_no_key ON public.materials USING btree (item_no)... |
| materials | materials_pkey | UNIQUE INDEX materials_pkey ON public.materials USING btree (id)... |
| migrations | migrations_name_key | UNIQUE INDEX migrations_name_key ON public.migrations USING btree (name)... |
| migrations | migrations_pkey | UNIQUE INDEX migrations_pkey ON public.migrations USING btree (id)... |
| model_bom_materials | idx_bom_is_active | INDEX idx_bom_is_active ON public.model_bom_materials USING btree (is_active) WH... |
| model_bom_materials | idx_bom_material_id | INDEX idx_bom_material_id ON public.model_bom_materials USING btree (material_id... |
| model_bom_materials | idx_bom_model_active | INDEX idx_bom_model_active ON public.model_bom_materials USING btree (model_id, ... |
| model_bom_materials | idx_bom_model_id | INDEX idx_bom_model_id ON public.model_bom_materials USING btree (model_id)... |
| model_bom_materials | model_bom_materials_model_id_material_id_key | UNIQUE INDEX model_bom_materials_model_id_material_id_key ON public.model_bom_ma... |
| model_bom_materials | model_bom_materials_pkey | UNIQUE INDEX model_bom_materials_pkey ON public.model_bom_materials USING btree ... |
| model_images | idx_model_images_model_id | INDEX idx_model_images_model_id ON public.model_images USING btree (model_id)... |
| model_images | model_images_pkey | UNIQUE INDEX model_images_pkey ON public.model_images USING btree (id)... |
| models | idx_models_calculation_type | INDEX idx_models_calculation_type ON public.models USING btree (calculation_type... |
| models | idx_models_regulation_id | INDEX idx_models_regulation_id ON public.models USING btree (regulation_id)... |
| models | idx_models_series | INDEX idx_models_series ON public.models USING btree (model_series)... |
| models | models_pkey | UNIQUE INDEX models_pkey ON public.models USING btree (id)... |
| notifications | idx_notifications_created_at | INDEX idx_notifications_created_at ON public.notifications USING btree (created_... |
| notifications | idx_notifications_read | INDEX idx_notifications_read ON public.notifications USING btree (read)... |
| notifications | idx_notifications_type | INDEX idx_notifications_type ON public.notifications USING btree (type)... |
| notifications | idx_notifications_user_id | INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)... |
| notifications | idx_notifications_user_read | INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, ... |
| notifications | notifications_pkey | UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)... |
| packaging | idx_packaging_model_id | INDEX idx_packaging_model_id ON public.packaging USING btree (model_id)... |
| packaging | packaging_pkey | UNIQUE INDEX packaging_pkey ON public.packaging USING btree (id)... |
| packaging_configs | idx_packaging_configs_factory | INDEX idx_packaging_configs_factory ON public.packaging_configs USING btree (fac... |
| packaging_configs | idx_packaging_configs_model_id | INDEX idx_packaging_configs_model_id ON public.packaging_configs USING btree (mo... |
| packaging_configs | idx_packaging_configs_type | INDEX idx_packaging_configs_type ON public.packaging_configs USING btree (packag... |
| packaging_configs | packaging_configs_model_id_config_name_key | UNIQUE INDEX packaging_configs_model_id_config_name_key ON public.packaging_conf... |
| packaging_configs | packaging_configs_pkey | UNIQUE INDEX packaging_configs_pkey ON public.packaging_configs USING btree (id)... |
| packaging_materials | idx_packaging_materials_config_id | INDEX idx_packaging_materials_config_id ON public.packaging_materials USING btre... |
| packaging_materials | packaging_materials_pkey | UNIQUE INDEX packaging_materials_pkey ON public.packaging_materials USING btree ... |
| permission_history | idx_permission_history_created | INDEX idx_permission_history_created ON public.permission_history USING btree (c... |
| permission_history | idx_permission_history_role | INDEX idx_permission_history_role ON public.permission_history USING btree (role... |
| permission_history | permission_history_pkey | UNIQUE INDEX permission_history_pkey ON public.permission_history USING btree (i... |
| permissions | permissions_code_key | UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code)... |
| permissions | permissions_pkey | UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id)... |
| price_history | price_history_pkey | UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id)... |
| process_config_history | idx_process_config_history_operated_at | INDEX idx_process_config_history_operated_at ON public.process_config_history US... |
| process_config_history | idx_process_config_history_packaging_config_id | INDEX idx_process_config_history_packaging_config_id ON public.process_config_hi... |
| process_config_history | process_config_history_pkey | UNIQUE INDEX process_config_history_pkey ON public.process_config_history USING ... |
| process_configs | idx_process_configs_packaging_config_id | INDEX idx_process_configs_packaging_config_id ON public.process_configs USING bt... |
| process_configs | process_configs_pkey | UNIQUE INDEX process_configs_pkey ON public.process_configs USING btree (id)... |
| processes | idx_processes_model_id | INDEX idx_processes_model_id ON public.processes USING btree (model_id)... |
| processes | processes_pkey | UNIQUE INDEX processes_pkey ON public.processes USING btree (id)... |
| quotation_custom_fees | idx_custom_fees_quotation | INDEX idx_custom_fees_quotation ON public.quotation_custom_fees USING btree (quo... |
| quotation_custom_fees | quotation_custom_fees_pkey | UNIQUE INDEX quotation_custom_fees_pkey ON public.quotation_custom_fees USING bt... |
| quotation_items | idx_quotation_items_category | INDEX idx_quotation_items_category ON public.quotation_items USING btree (catego... |
| quotation_items | idx_quotation_items_quotation_id | INDEX idx_quotation_items_quotation_id ON public.quotation_items USING btree (qu... |
| quotation_items | quotation_items_pkey | UNIQUE INDEX quotation_items_pkey ON public.quotation_items USING btree (id)... |
| quotations | idx_quotations_batch_id | INDEX idx_quotations_batch_id ON public.quotations USING btree (batch_id)... |
| quotations | idx_quotations_created_at | INDEX idx_quotations_created_at ON public.quotations USING btree (created_at DES... |
| quotations | idx_quotations_created_by | INDEX idx_quotations_created_by ON public.quotations USING btree (created_by)... |
| quotations | idx_quotations_customer | INDEX idx_quotations_customer ON public.quotations USING btree (customer_name)... |
| quotations | idx_quotations_customer_id | INDEX idx_quotations_customer_id ON public.quotations USING btree (customer_id)... |
| quotations | idx_quotations_deleted | INDEX idx_quotations_deleted ON public.quotations USING btree (deleted_at) WHERE... |
| quotations | idx_quotations_is_estimation | INDEX idx_quotations_is_estimation ON public.quotations USING btree (is_estimati... |
| quotations | idx_quotations_status | INDEX idx_quotations_status ON public.quotations USING btree (status)... |
| quotations | idx_quotations_status_created | INDEX idx_quotations_status_created ON public.quotations USING btree (status, cr... |
| quotations | quotations_pkey | UNIQUE INDEX quotations_pkey ON public.quotations USING btree (id)... |
| quotations | quotations_quotation_no_key | UNIQUE INDEX quotations_quotation_no_key ON public.quotations USING btree (quota... |
| regulations | regulations_name_key | UNIQUE INDEX regulations_name_key ON public.regulations USING btree (name)... |
| regulations | regulations_pkey | UNIQUE INDEX regulations_pkey ON public.regulations USING btree (id)... |
| review_history | idx_review_history_action | INDEX idx_review_history_action ON public.review_history USING btree (action)... |
| review_history | idx_review_history_created_at | INDEX idx_review_history_created_at ON public.review_history USING btree (create... |
| review_history | idx_review_history_quotation | INDEX idx_review_history_quotation ON public.review_history USING btree (quotati... |
| review_history | review_history_pkey | UNIQUE INDEX review_history_pkey ON public.review_history USING btree (id)... |
| role_permissions | idx_role_permissions_permission | INDEX idx_role_permissions_permission ON public.role_permissions USING btree (pe... |
| role_permissions | idx_role_permissions_role | INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_cod... |
| role_permissions | role_permissions_pkey | UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id)... |
| role_permissions | role_permissions_role_code_permission_code_key | UNIQUE INDEX role_permissions_role_code_permission_code_key ON public.role_permi... |
| roles | roles_code_key | UNIQUE INDEX roles_code_key ON public.roles USING btree (code)... |
| roles | roles_pkey | UNIQUE INDEX roles_pkey ON public.roles USING btree (id)... |
| standard_cost_updates | idx_scu_batch | INDEX idx_scu_batch ON public.standard_cost_updates USING btree (batch_id)... |
| standard_cost_updates | idx_scu_expires | INDEX idx_scu_expires ON public.standard_cost_updates USING btree (expires_at) W... |
| standard_cost_updates | idx_scu_pending_unique | UNIQUE INDEX idx_scu_pending_unique ON public.standard_cost_updates USING btree ... |
| standard_cost_updates | idx_scu_standard_cost | INDEX idx_scu_standard_cost ON public.standard_cost_updates USING btree (standar... |
| standard_cost_updates | idx_scu_status | INDEX idx_scu_status ON public.standard_cost_updates USING btree (status)... |
| standard_cost_updates | standard_cost_updates_pkey | UNIQUE INDEX standard_cost_updates_pkey ON public.standard_cost_updates USING bt... |
| standard_costs | idx_standard_costs_is_current | INDEX idx_standard_costs_is_current ON public.standard_costs USING btree (is_cur... |
| standard_costs | idx_standard_costs_packaging_config | INDEX idx_standard_costs_packaging_config ON public.standard_costs USING btree (... |
| standard_costs | idx_standard_costs_sales_type | INDEX idx_standard_costs_sales_type ON public.standard_costs USING btree (sales_... |
| standard_costs | standard_costs_packaging_config_id_sales_type_version_key | UNIQUE INDEX standard_costs_packaging_config_id_sales_type_version_key ON public... |
| standard_costs | standard_costs_pkey | UNIQUE INDEX standard_costs_pkey ON public.standard_costs USING btree (id)... |
| system_config | system_config_config_key_key | UNIQUE INDEX system_config_config_key_key ON public.system_config USING btree (c... |
| system_config | system_config_pkey | UNIQUE INDEX system_config_pkey ON public.system_config USING btree (id)... |
| user_notifications | idx_user_notifications_notification_id | INDEX idx_user_notifications_notification_id ON public.user_notifications USING ... |
| user_notifications | idx_user_notifications_user_id | INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (u... |
| user_notifications | user_notifications_pkey | UNIQUE INDEX user_notifications_pkey ON public.user_notifications USING btree (i... |
| user_notifications | user_notifications_user_id_notification_id_key | UNIQUE INDEX user_notifications_user_id_notification_id_key ON public.user_notif... |
| users | idx_users_username | INDEX idx_users_username ON public.users USING btree (username)... |
| users | users_pkey | UNIQUE INDEX users_pkey ON public.users USING btree (id)... |
| users | users_username_key | UNIQUE INDEX users_username_key ON public.users USING btree (username)... |

## 触发器

| 触发器名 | 表名 | 时机 | 事件 | 动作 |
|----------|------|------|------|------|
| update_roles_updated_at | roles | BEFORE | UPDATE | EXECUTE FUNCTION update_updated_at_column()... |

## 存储过程/函数

| 名称 | 类型 | 返回类型 |
|------|------|----------|
| update_updated_at_column | FUNCTION | trigger |
