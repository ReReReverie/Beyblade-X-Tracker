/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,bladePartId,ratchetPartId,bitPartId]` on the table `Combo` will be added. If there are existing duplicate values, this will fail.
  - Made the column `bitPartId` on table `Combo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bladePartId` on table `Combo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ratchetPartId` on table `Combo` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Combo_bladePartId_ratchetPartId_bitPartId_idx";

-- AlterTable
ALTER TABLE "Combo" ALTER COLUMN "bitPartId" SET NOT NULL,
ALTER COLUMN "bladePartId" SET NOT NULL,
ALTER COLUMN "ratchetPartId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Combo_ownerId_bladePartId_ratchetPartId_bitPartId_key" ON "Combo"("ownerId", "bladePartId", "ratchetPartId", "bitPartId");
