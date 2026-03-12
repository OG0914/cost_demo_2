-- 旧数据库 Schema 导出
-- 数据库: cost_analysis
-- 生成时间: 2026-03-12T06:27:34.918Z

CREATE TABLE "comments" (
  "id" integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  "quotation_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
  "id" integer NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  "vc_code" character varying(50) NOT NULL,
  "name" character varying(100) NOT NULL,
  "region" character varying(100),
  "remark" text,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "user_id" integer,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_price_changes" (
  "id" integer NOT NULL DEFAULT nextval('material_price_changes_id_seq'::regclass),
  "material_id" integer NOT NULL,
  "old_price" numeric(12,4) NOT NULL,
  "new_price" numeric(12,4) NOT NULL,
  "price_change_rate" numeric(8,6),
  "changed_by" integer NOT NULL,
  "changed_at" timestamp without time zone DEFAULT now(),
  "is_processed" boolean DEFAULT false,
  CONSTRAINT "material_price_changes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "materials" (
  "id" integer NOT NULL DEFAULT nextval('materials_id_seq'::regclass),
  "item_no" character varying(100) NOT NULL,
  "name" character varying(200) NOT NULL,
  "unit" character varying(50) NOT NULL,
  "price" numeric(12,4) NOT NULL,
  "currency" character varying(10) NOT NULL DEFAULT 'CNY'::character varying,
  "manufacturer" character varying(200),
  "usage_amount" numeric(12,6),
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "category" character varying(50),
  "deleted_at" timestamp without time zone,
  "material_type" character varying(20) DEFAULT 'general'::character varying,
  "subcategory" character varying(100),
  "product_desc" text,
  "packaging_mode" character varying(50),
  "supplier" character varying(100),
  "production_date" date,
  "moq" integer,
  "remark" text,
  "production_cycle" character varying(50),
  CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "migrations" (
  "id" integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "executed_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_bom_materials" (
  "id" integer NOT NULL DEFAULT nextval('model_bom_materials_id_seq'::regclass),
  "model_id" integer NOT NULL,
  "material_id" integer NOT NULL,
  "usage_amount" numeric(12,6) NOT NULL,
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "model_bom_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_images" (
  "id" integer NOT NULL DEFAULT nextval('model_images_id_seq'::regclass),
  "model_id" integer NOT NULL,
  "file_name" character varying(255) NOT NULL,
  "file_path" character varying(500) NOT NULL,
  "file_size" integer,
  "is_primary" boolean DEFAULT false,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "model_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "models" (
  "id" integer NOT NULL DEFAULT nextval('models_id_seq'::regclass),
  "regulation_id" integer NOT NULL,
  "model_name" character varying(200) NOT NULL,
  "model_category" character varying(100),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "model_series" character varying(50),
  "calculation_type" character varying(20),
  CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  "user_id" integer NOT NULL,
  "type" character varying(20) NOT NULL,
  "title" character varying(200) NOT NULL,
  "content" text NOT NULL,
  "read" boolean DEFAULT false,
  "related_id" integer,
  "related_type" character varying(50),
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "role" character varying(20),
  "material_id" integer,
  "price_change_id" integer,
  "model_id" integer,
  "standard_cost_id" integer,
  "quotation_id" integer,
  "is_dismissed" boolean DEFAULT false,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "packaging" (
  "id" integer NOT NULL DEFAULT nextval('packaging_id_seq'::regclass),
  "name" character varying(200) NOT NULL,
  "usage_amount" numeric(12,6) NOT NULL,
  "price" numeric(12,4) NOT NULL,
  "currency" character varying(10) NOT NULL DEFAULT 'CNY'::character varying,
  "model_id" integer NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "packaging_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "packaging_configs" (
  "id" integer NOT NULL DEFAULT nextval('packaging_configs_id_seq'::regclass),
  "model_id" integer NOT NULL,
  "config_name" character varying(200) NOT NULL,
  "pc_per_bag" integer NOT NULL,
  "bags_per_box" integer NOT NULL,
  "boxes_per_carton" integer NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "packaging_type" character varying(20) NOT NULL DEFAULT 'standard_box'::character varying,
  "layer1_qty" integer NOT NULL,
  "layer2_qty" integer NOT NULL,
  "layer3_qty" integer,
  "factory" character varying(50) DEFAULT 'dongguan_xunan'::character varying,
  "last_modified_by" integer,
  "last_process_total" numeric(12,4),
  CONSTRAINT "packaging_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "packaging_materials" (
  "id" integer NOT NULL DEFAULT nextval('packaging_materials_id_seq'::regclass),
  "packaging_config_id" integer NOT NULL,
  "material_name" character varying(200) NOT NULL,
  "basic_usage" numeric(12,6) NOT NULL,
  "unit_price" numeric(12,4) NOT NULL,
  "carton_volume" numeric(12,6),
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "packaging_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permission_history" (
  "id" integer NOT NULL DEFAULT nextval('permission_history_id_seq'::regclass),
  "role_code" character varying(50) NOT NULL,
  "permission_code" character varying(100) NOT NULL,
  "action" character varying(20) NOT NULL,
  "operator_id" integer NOT NULL,
  "operator_name" character varying(100),
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "permission_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
  "id" integer NOT NULL DEFAULT nextval('permissions_id_seq'::regclass),
  "code" character varying(100) NOT NULL,
  "label" character varying(100) NOT NULL,
  "module" character varying(50) NOT NULL,
  "description" text,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_history" (
  "id" integer NOT NULL DEFAULT nextval('price_history_id_seq'::regclass),
  "item_type" character varying(20) NOT NULL,
  "item_id" integer NOT NULL,
  "old_price" numeric(12,4) NOT NULL,
  "new_price" numeric(12,4) NOT NULL,
  "changed_by" integer NOT NULL,
  "changed_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "process_config_history" (
  "id" integer NOT NULL DEFAULT nextval('process_config_history_id_seq'::regclass),
  "packaging_config_id" integer NOT NULL,
  "process_id" integer,
  "action" character varying(20) NOT NULL,
  "old_data" jsonb,
  "new_data" jsonb,
  "old_process_total" numeric(12,4),
  "new_process_total" numeric(12,4),
  "operated_by" integer NOT NULL,
  "operated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "process_config_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "process_configs" (
  "id" integer NOT NULL DEFAULT nextval('process_configs_id_seq'::regclass),
  "packaging_config_id" integer NOT NULL,
  "process_name" character varying(200) NOT NULL,
  "unit_price" numeric(12,4) NOT NULL,
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "process_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "processes" (
  "id" integer NOT NULL DEFAULT nextval('processes_id_seq'::regclass),
  "name" character varying(200) NOT NULL,
  "price" numeric(12,4) NOT NULL,
  "model_id" integer NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotation_custom_fees" (
  "id" integer NOT NULL DEFAULT nextval('quotation_custom_fees_id_seq'::regclass),
  "quotation_id" integer NOT NULL,
  "fee_name" character varying(200) NOT NULL,
  "fee_rate" numeric(8,6) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "quotation_custom_fees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotation_items" (
  "id" integer NOT NULL DEFAULT nextval('quotation_items_id_seq'::regclass),
  "quotation_id" integer NOT NULL,
  "category" character varying(20) NOT NULL,
  "item_name" character varying(200) NOT NULL,
  "usage_amount" numeric(12,6) NOT NULL,
  "unit_price" numeric(12,4) NOT NULL,
  "subtotal" numeric(12,4) NOT NULL,
  "is_changed" boolean DEFAULT false,
  "original_value" numeric(12,4),
  "material_id" integer,
  "after_overhead" boolean DEFAULT false,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotations" (
  "id" integer NOT NULL DEFAULT nextval('quotations_id_seq'::regclass),
  "quotation_no" character varying(50) NOT NULL,
  "customer_name" character varying(200) NOT NULL,
  "customer_region" character varying(100) NOT NULL,
  "model_id" integer NOT NULL,
  "regulation_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "freight_total" numeric(12,4) NOT NULL,
  "freight_per_unit" numeric(12,4) NOT NULL,
  "sales_type" character varying(20) NOT NULL,
  "shipping_method" character varying(20),
  "port" character varying(100),
  "base_cost" numeric(12,4) NOT NULL,
  "overhead_price" numeric(12,4) NOT NULL,
  "final_price" numeric(12,4) NOT NULL,
  "currency" character varying(10) NOT NULL DEFAULT 'CNY'::character varying,
  "status" character varying(20) NOT NULL DEFAULT 'draft'::character varying,
  "created_by" integer NOT NULL,
  "reviewed_by" integer,
  "packaging_config_id" integer,
  "include_freight_in_base" boolean DEFAULT true,
  "custom_profit_tiers" text,
  "vat_rate" numeric(5,4),
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  "submitted_at" timestamp without time zone,
  "reviewed_at" timestamp without time zone,
  "customer_id" integer,
  "batch_id" character varying(50),
  "batch_remark" character varying(200),
  "source_standard_cost_id" integer,
  "is_estimation" boolean DEFAULT false,
  "reference_standard_cost_id" integer,
  "deleted_at" timestamp without time zone,
  CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "regulations" (
  "id" integer NOT NULL DEFAULT nextval('regulations_id_seq'::regclass),
  "name" character varying(100) NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_history" (
  "id" integer NOT NULL DEFAULT nextval('review_history_id_seq'::regclass),
  "quotation_id" integer NOT NULL,
  "action" character varying(20) NOT NULL,
  "operator_id" integer NOT NULL,
  "comment" text,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "review_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "id" integer NOT NULL DEFAULT nextval('role_permissions_id_seq'::regclass),
  "role_code" character varying(50) NOT NULL,
  "permission_code" character varying(100) NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
  "id" integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  "code" character varying(50) NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text,
  "icon" character varying(50) DEFAULT 'ri-user-line'::character varying,
  "is_system" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "standard_cost_updates" (
  "id" integer NOT NULL DEFAULT nextval('standard_cost_updates_id_seq'::regclass),
  "batch_id" character varying(50),
  "standard_cost_id" integer NOT NULL,
  "status" character varying(20) DEFAULT 'pending'::character varying,
  "trigger_info" jsonb NOT NULL,
  "original_base_cost" numeric(12,4) NOT NULL,
  "new_base_cost" numeric(12,4) NOT NULL,
  "diff_amount" numeric(12,4) NOT NULL,
  "diff_percent" numeric(5,2),
  "reviewed_by" integer,
  "reviewed_at" timestamp without time zone,
  "review_comment" text,
  "created_at" timestamp without time zone DEFAULT now(),
  "expires_at" timestamp without time zone,
  CONSTRAINT "standard_cost_updates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "standard_costs" (
  "id" integer NOT NULL DEFAULT nextval('standard_costs_id_seq'::regclass),
  "packaging_config_id" integer NOT NULL,
  "quotation_id" integer NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "is_current" boolean DEFAULT true,
  "base_cost" numeric(12,4) NOT NULL,
  "overhead_price" numeric(12,4) NOT NULL,
  "domestic_price" numeric(12,4),
  "export_price" numeric(12,4),
  "quantity" integer NOT NULL,
  "currency" character varying(10) DEFAULT 'CNY'::character varying,
  "sales_type" character varying(20) NOT NULL,
  "set_by" integer NOT NULL,
  "created_at" timestamp without time zone DEFAULT now(),
  "source" character varying(20) DEFAULT 'manual'::character varying,
  "trigger_info" jsonb,
  CONSTRAINT "standard_costs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_config" (
  "id" integer NOT NULL DEFAULT nextval('system_config_id_seq'::regclass),
  "config_key" character varying(100) NOT NULL,
  "config_value" text NOT NULL,
  "description" text,
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_notifications" (
  "id" integer NOT NULL DEFAULT nextval('user_notifications_id_seq'::regclass),
  "user_id" integer NOT NULL,
  "notification_id" integer NOT NULL,
  "is_read" boolean DEFAULT false,
  "is_dismissed" boolean DEFAULT false,
  "read_at" timestamp without time zone,
  "created_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "username" character varying(100) NOT NULL,
  "password" character varying(255) NOT NULL,
  "role" character varying(20) NOT NULL,
  "real_name" character varying(100),
  "email" character varying(255),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 外键约束
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "comments" ADD CONSTRAINT "comments_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "material_price_changes" ADD CONSTRAINT "material_price_changes_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id");
ALTER TABLE "material_price_changes" ADD CONSTRAINT "material_price_changes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id");
ALTER TABLE "model_bom_materials" ADD CONSTRAINT "model_bom_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id");
ALTER TABLE "model_bom_materials" ADD CONSTRAINT "model_bom_materials_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "model_images" ADD CONSTRAINT "model_images_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "models" ADD CONSTRAINT "models_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_standard_cost_id_fkey" FOREIGN KEY ("standard_cost_id") REFERENCES "standard_costs"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_price_change_id_fkey" FOREIGN KEY ("price_change_id") REFERENCES "material_price_changes"("id");
ALTER TABLE "packaging" ADD CONSTRAINT "packaging_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "packaging_configs" ADD CONSTRAINT "packaging_configs_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id");
ALTER TABLE "packaging_configs" ADD CONSTRAINT "packaging_configs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "packaging_materials" ADD CONSTRAINT "packaging_materials_packaging_config_id_fkey" FOREIGN KEY ("packaging_config_id") REFERENCES "packaging_configs"("id");
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id");
ALTER TABLE "process_config_history" ADD CONSTRAINT "process_config_history_packaging_config_id_fkey" FOREIGN KEY ("packaging_config_id") REFERENCES "packaging_configs"("id");
ALTER TABLE "process_config_history" ADD CONSTRAINT "process_config_history_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "process_configs"("id");
ALTER TABLE "process_config_history" ADD CONSTRAINT "process_config_history_operated_by_fkey" FOREIGN KEY ("operated_by") REFERENCES "users"("id");
ALTER TABLE "process_configs" ADD CONSTRAINT "process_configs_packaging_config_id_fkey" FOREIGN KEY ("packaging_config_id") REFERENCES "packaging_configs"("id");
ALTER TABLE "processes" ADD CONSTRAINT "processes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "quotation_custom_fees" ADD CONSTRAINT "quotation_custom_fees_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_reference_standard_cost_id_fkey" FOREIGN KEY ("reference_standard_cost_id") REFERENCES "standard_costs"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_packaging_config_id_fkey" FOREIGN KEY ("packaging_config_id") REFERENCES "packaging_configs"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id");
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id");
ALTER TABLE "standard_cost_updates" ADD CONSTRAINT "standard_cost_updates_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");
ALTER TABLE "standard_cost_updates" ADD CONSTRAINT "standard_cost_updates_standard_cost_id_fkey" FOREIGN KEY ("standard_cost_id") REFERENCES "standard_costs"("id");
ALTER TABLE "standard_costs" ADD CONSTRAINT "standard_costs_packaging_config_id_fkey" FOREIGN KEY ("packaging_config_id") REFERENCES "packaging_configs"("id");
ALTER TABLE "standard_costs" ADD CONSTRAINT "standard_costs_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "standard_costs" ADD CONSTRAINT "standard_costs_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "users"("id");
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id");
