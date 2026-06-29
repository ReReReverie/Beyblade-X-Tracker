CREATE TYPE "BattleFormat" AS ENUM ('ONE_V_ONE', 'THREE_V_THREE');

CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeckSlot" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "DeckSlot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Battle" ADD COLUMN "format" "BattleFormat" NOT NULL DEFAULT 'ONE_V_ONE';
ALTER TABLE "Battle" ADD COLUMN "deckAId" TEXT;
ALTER TABLE "Battle" ADD COLUMN "deckBId" TEXT;
ALTER TABLE "Battle" ADD COLUMN "deckWinnerId" TEXT;
ALTER TABLE "Battle" ALTER COLUMN "comboAId" DROP NOT NULL;
ALTER TABLE "Battle" ALTER COLUMN "comboBId" DROP NOT NULL;
ALTER TABLE "Battle" ALTER COLUMN "winnerId" DROP NOT NULL;

CREATE INDEX "Deck_ownerId_idx" ON "Deck"("ownerId");
CREATE INDEX "Deck_visibility_idx" ON "Deck"("visibility");
CREATE INDEX "Deck_createdAt_idx" ON "Deck"("createdAt");
CREATE UNIQUE INDEX "DeckSlot_deckId_slot_key" ON "DeckSlot"("deckId", "slot");
CREATE UNIQUE INDEX "DeckSlot_deckId_comboId_key" ON "DeckSlot"("deckId", "comboId");
CREATE INDEX "DeckSlot_comboId_idx" ON "DeckSlot"("comboId");
CREATE INDEX "Battle_format_idx" ON "Battle"("format");
CREATE INDEX "Battle_deckAId_idx" ON "Battle"("deckAId");
CREATE INDEX "Battle_deckBId_idx" ON "Battle"("deckBId");
CREATE INDEX "Battle_deckWinnerId_idx" ON "Battle"("deckWinnerId");

ALTER TABLE "Deck" ADD CONSTRAINT "Deck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeckSlot" ADD CONSTRAINT "DeckSlot_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeckSlot" ADD CONSTRAINT "DeckSlot_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_deckAId_fkey" FOREIGN KEY ("deckAId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_deckBId_fkey" FOREIGN KEY ("deckBId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_deckWinnerId_fkey" FOREIGN KEY ("deckWinnerId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
