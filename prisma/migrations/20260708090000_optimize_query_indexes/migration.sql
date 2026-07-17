-- Composite indexes for the app's common Neon query paths.
-- These target filtered public listings, owner dashboards, recent battle history, and admin counts.

CREATE INDEX "PartCatalog_metaTier_type_name_idx" ON "PartCatalog"("metaTier", "type", "name");

CREATE INDEX "Part_ownerId_createdAt_idx" ON "Part"("ownerId", "createdAt");
CREATE INDEX "Part_visibility_createdAt_idx" ON "Part"("visibility", "createdAt");

CREATE INDEX "PartPhoto_ownerId_createdAt_idx" ON "PartPhoto"("ownerId", "createdAt");
CREATE INDEX "PartPhoto_partId_visibility_createdAt_idx" ON "PartPhoto"("partId", "visibility", "createdAt");

CREATE INDEX "Combo_ownerId_createdAt_idx" ON "Combo"("ownerId", "createdAt");
CREATE INDEX "Combo_ownerId_bitPartId_ratchetPartId_idx" ON "Combo"("ownerId", "bitPartId", "ratchetPartId");
CREATE INDEX "Combo_visibility_createdAt_idx" ON "Combo"("visibility", "createdAt");

CREATE INDEX "Deck_ownerId_createdAt_idx" ON "Deck"("ownerId", "createdAt");
CREATE INDEX "Deck_visibility_createdAt_idx" ON "Deck"("visibility", "createdAt");

CREATE INDEX "ComboStar_userId_comboId_idx" ON "ComboStar"("userId", "comboId");
CREATE INDEX "ComboPut_userId_comboId_idx" ON "ComboPut"("userId", "comboId");

CREATE INDEX "FeaturedCombo_startsAt_endsAt_idx" ON "FeaturedCombo"("startsAt", "endsAt");

CREATE INDEX "VisitorActivity_userId_lastSeen_idx" ON "VisitorActivity"("userId", "lastSeen");

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_kind_status_createdAt_idx" ON "Report"("kind", "status", "createdAt");

CREATE INDEX "ComboPhoto_ownerId_createdAt_idx" ON "ComboPhoto"("ownerId", "createdAt");
CREATE INDEX "ComboPhoto_comboId_visibility_createdAt_idx" ON "ComboPhoto"("comboId", "visibility", "createdAt");

CREATE INDEX "Battle_ownerId_createdAt_idx" ON "Battle"("ownerId", "createdAt");
CREATE INDEX "Battle_ownerId_playedAt_idx" ON "Battle"("ownerId", "playedAt");
CREATE INDEX "Battle_visibility_playedAt_idx" ON "Battle"("visibility", "playedAt");
CREATE INDEX "Battle_comboAId_visibility_playedAt_idx" ON "Battle"("comboAId", "visibility", "playedAt");
CREATE INDEX "Battle_comboBId_visibility_playedAt_idx" ON "Battle"("comboBId", "visibility", "playedAt");
CREATE INDEX "Battle_winnerId_visibility_idx" ON "Battle"("winnerId", "visibility");
CREATE INDEX "Battle_deckAId_visibility_idx" ON "Battle"("deckAId", "visibility");
CREATE INDEX "Battle_deckBId_visibility_idx" ON "Battle"("deckBId", "visibility");
CREATE INDEX "Battle_deckWinnerId_visibility_idx" ON "Battle"("deckWinnerId", "visibility");
