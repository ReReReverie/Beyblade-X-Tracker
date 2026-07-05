-- CreateEnum
CREATE TYPE "PartSeries" AS ENUM ('BX', 'UX', 'CX', 'CX_EXPANDED');

-- CreateEnum
CREATE TYPE "RatchetIntegration" AS ENUM ('NONE', 'BLADE', 'BIT');

-- DropForeignKey
ALTER TABLE "Combo" DROP CONSTRAINT "Combo_ratchetPartId_fkey";

-- AlterTable
ALTER TABLE "Combo" ALTER COLUMN "ratchetPartId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "ratchetIntegration" "RatchetIntegration" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "series" "PartSeries";

-- AlterTable
ALTER TABLE "PartCatalog" ADD COLUMN     "ratchetIntegration" "RatchetIntegration" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "series" "PartSeries";

-- CreateIndex
CREATE INDEX "Part_series_idx" ON "Part"("series");

-- CreateIndex
CREATE INDEX "PartCatalog_series_idx" ON "PartCatalog"("series");

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_ratchetPartId_fkey" FOREIGN KEY ("ratchetPartId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
