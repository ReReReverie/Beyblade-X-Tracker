ALTER TABLE "User" ADD COLUMN "bio" TEXT;

CREATE TABLE "CareerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentName" TEXT NOT NULL,
    "placement" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CareerEntry_userId_playedAt_idx" ON "CareerEntry"("userId", "playedAt");

ALTER TABLE "CareerEntry" ADD CONSTRAINT "CareerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
