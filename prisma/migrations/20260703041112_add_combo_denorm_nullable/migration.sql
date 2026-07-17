-- AlterTable
ALTER TABLE "Combo" ADD COLUMN     "bitPartId" TEXT,
ADD COLUMN     "bladePartId" TEXT,
ADD COLUMN     "ratchetPartId" TEXT;

-- AlterTable
ALTER TABLE "Part" ALTER COLUMN "weightGrams" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PartCatalog" ALTER COLUMN "weightGrams" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Combo_bladePartId_ratchetPartId_bitPartId_idx" ON "Combo"("bladePartId", "ratchetPartId", "bitPartId");
