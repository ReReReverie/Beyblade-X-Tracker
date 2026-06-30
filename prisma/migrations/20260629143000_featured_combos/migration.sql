CREATE TYPE "FeaturedSlot" AS ENUM ('DAY', 'WEEK', 'MONTH', 'SPONSOR');

CREATE TABLE "FeaturedCombo" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "slot" "FeaturedSlot" NOT NULL,
    "title" TEXT NOT NULL,
    "sponsorName" TEXT,
    "posterUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedCombo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeaturedCombo_slot_startsAt_endsAt_idx" ON "FeaturedCombo"("slot", "startsAt", "endsAt");
CREATE INDEX "FeaturedCombo_comboId_idx" ON "FeaturedCombo"("comboId");
CREATE INDEX "FeaturedCombo_endsAt_idx" ON "FeaturedCombo"("endsAt");

ALTER TABLE "FeaturedCombo" ADD CONSTRAINT "FeaturedCombo_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
