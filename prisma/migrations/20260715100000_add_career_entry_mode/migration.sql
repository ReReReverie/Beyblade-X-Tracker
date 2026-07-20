-- CreateEnum
CREATE TYPE "CareerEntryMode" AS ENUM ('MANUAL', 'CHALLONGE');

-- AlterTable
ALTER TABLE "CareerEntry" ADD COLUMN "mode" "CareerEntryMode" NOT NULL DEFAULT 'MANUAL';
