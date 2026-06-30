/*
  Warnings:

  - Made the column `layer_1` on table `packaging_configs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `layer_2` on table `packaging_configs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "packaging_configs" ALTER COLUMN "layer_1" SET NOT NULL,
ALTER COLUMN "layer_2" SET NOT NULL;
