-- CreateTable
CREATE TABLE "ComboPut" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboPut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboComment" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboPut_comboId_idx" ON "ComboPut"("comboId");

-- CreateIndex
CREATE INDEX "ComboPut_userId_idx" ON "ComboPut"("userId");

-- CreateIndex
CREATE INDEX "ComboPut_createdAt_idx" ON "ComboPut"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComboPut_comboId_userId_key" ON "ComboPut"("comboId", "userId");

-- CreateIndex
CREATE INDEX "ComboComment_comboId_createdAt_idx" ON "ComboComment"("comboId", "createdAt");

-- CreateIndex
CREATE INDEX "ComboComment_authorId_idx" ON "ComboComment"("authorId");

-- AddForeignKey
ALTER TABLE "ComboPut" ADD CONSTRAINT "ComboPut_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboPut" ADD CONSTRAINT "ComboPut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboComment" ADD CONSTRAINT "ComboComment_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboComment" ADD CONSTRAINT "ComboComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
