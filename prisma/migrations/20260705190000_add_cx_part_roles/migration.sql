-- CreateEnum
CREATE TYPE "PartRole" AS ENUM ('BLADE', 'RATCHET', 'BIT', 'LOCK_CHIP', 'MAIN_BLADE', 'ASSIST_BLADE', 'OVER_BLADE', 'METAL_BLADE');

-- AlterTable
ALTER TABLE "PartCatalog" ADD COLUMN "role" "PartRole";

-- AlterTable
ALTER TABLE "Part" ADD COLUMN "role" "PartRole";

-- Backfill broad part roles.
UPDATE "PartCatalog" SET "role" = "type"::text::"PartRole";
UPDATE "Part" SET "role" = "type"::text::"PartRole";

-- Alter ComboPart role from broad type to combo-specific role.
ALTER TABLE "ComboPart" ALTER COLUMN "role" TYPE "PartRole" USING "role"::text::"PartRole";

-- CX combos can share primary lock chip / ratchet / bit while differing by sub-parts.
ALTER TABLE "Combo" DROP CONSTRAINT IF EXISTS "Combo_ownerId_bladePartId_ratchetPartId_bitPartId_key";

-- CreateIndex
CREATE INDEX "PartCatalog_role_idx" ON "PartCatalog"("role");
CREATE INDEX "Part_role_idx" ON "Part"("role");
