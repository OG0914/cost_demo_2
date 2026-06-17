-- DropForeignKey
ALTER TABLE "bom_materials" DROP CONSTRAINT "bom_materials_material_id_fkey";

-- CreateTable
CREATE TABLE "sequence_numbers" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequence_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sequence_numbers_prefix_key" ON "sequence_numbers"("prefix");

-- CreateIndex
CREATE INDEX "sequence_numbers_prefix_idx" ON "sequence_numbers"("prefix");

-- CreateIndex
CREATE INDEX "bom_materials_model_id_idx" ON "bom_materials"("model_id");

-- CreateIndex
CREATE INDEX "bom_materials_material_id_idx" ON "bom_materials"("material_id");

-- CreateIndex
CREATE INDEX "customers_created_by_idx" ON "customers"("created_by");

-- CreateIndex
CREATE INDEX "customers_updated_by_idx" ON "customers"("updated_by");

-- CreateIndex
CREATE INDEX "models_regulation_id_idx" ON "models"("regulation_id");

-- CreateIndex
CREATE INDEX "notifications_material_id_idx" ON "notifications"("material_id");

-- CreateIndex
CREATE INDEX "notifications_processed_by_idx" ON "notifications"("processed_by");

-- CreateIndex
CREATE INDEX "packaging_configs_model_id_idx" ON "packaging_configs"("model_id");

-- CreateIndex
CREATE INDEX "packaging_materials_packaging_config_id_idx" ON "packaging_materials"("packaging_config_id");

-- CreateIndex
CREATE INDEX "process_configs_packaging_config_id_idx" ON "process_configs"("packaging_config_id");

-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_regulation_id_idx" ON "quotations"("regulation_id");

-- CreateIndex
CREATE INDEX "quotations_model_id_idx" ON "quotations"("model_id");

-- CreateIndex
CREATE INDEX "quotations_packaging_config_id_idx" ON "quotations"("packaging_config_id");

-- CreateIndex
CREATE INDEX "quotations_created_by_idx" ON "quotations"("created_by");

-- CreateIndex
CREATE INDEX "quotations_reviewed_by_idx" ON "quotations"("reviewed_by");

-- CreateIndex
CREATE INDEX "quotations_status_created_at_idx" ON "quotations"("status", "created_at");

-- CreateIndex
CREATE INDEX "quotations_created_at_idx" ON "quotations"("created_at");

-- CreateIndex
CREATE INDEX "standard_costs_packaging_config_id_idx" ON "standard_costs"("packaging_config_id");

-- CreateIndex
CREATE INDEX "standard_costs_set_by_idx" ON "standard_costs"("set_by");

-- AddForeignKey
ALTER TABLE "bom_materials" ADD CONSTRAINT "bom_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
