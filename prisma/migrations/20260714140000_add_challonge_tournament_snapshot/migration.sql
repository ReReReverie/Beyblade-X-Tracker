-- AlterTable
ALTER TABLE "CareerEntry" ADD COLUMN "challongeSnapshot" JSONB,
ADD COLUMN "challongeSyncError" TEXT,
ADD COLUMN "challongeSyncedAt" TIMESTAMP(3),
ADD COLUMN "challongeSyncFrozen" BOOLEAN NOT NULL DEFAULT false;
