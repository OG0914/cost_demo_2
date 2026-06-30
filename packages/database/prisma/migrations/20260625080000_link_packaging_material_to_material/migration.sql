-- Truncate existing packaging material data (old name/price columns will be removed)
TRUNCATE TABLE "packaging_materials";

-- Drop old columns
ALTER TABLE "packaging_materials" DROP COLUMN "name";
ALTER TABLE "packaging_materials" DROP COLUMN "price";

-- Add material relation
ALTER TABLE "packaging_materials" ADD COLUMN "material_id" TEXT NOT NULL;

-- Add foreign key constraint
ALTER TABLE "packaging_materials" ADD CONSTRAINT "packaging_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "packaging_materials_packaging_config_id_idx" ON "packaging_materials"("packaging_config_id");
CREATE INDEX IF NOT EXISTS "packaging_materials_material_id_idx" ON "packaging_materials"("material_id");
