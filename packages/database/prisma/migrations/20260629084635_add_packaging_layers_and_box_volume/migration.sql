-- AlterTable
ALTER TABLE "packaging_configs" ADD COLUMN     "layer_1" INTEGER,
ADD COLUMN     "layer_2" INTEGER,
ADD COLUMN     "layer_3" INTEGER,
ALTER COLUMN "per_box" DROP NOT NULL;

-- AlterTable
ALTER TABLE "packaging_materials" ADD COLUMN     "box_volume" DECIMAL(10,4);
