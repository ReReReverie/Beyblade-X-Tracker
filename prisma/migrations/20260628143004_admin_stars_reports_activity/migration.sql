-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('BUG', 'REQUEST');

-- CreateTable
CREATE TABLE "ComboStar" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboStar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorActivity" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "kind" "ReportKind" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboStar_comboId_idx" ON "ComboStar"("comboId");

-- CreateIndex
CREATE INDEX "ComboStar_userId_idx" ON "ComboStar"("userId");

-- CreateIndex
CREATE INDEX "ComboStar_createdAt_idx" ON "ComboStar"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComboStar_comboId_userId_key" ON "ComboStar"("comboId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorActivity_visitorId_key" ON "VisitorActivity"("visitorId");

-- CreateIndex
CREATE INDEX "VisitorActivity_lastSeen_idx" ON "VisitorActivity"("lastSeen");

-- CreateIndex
CREATE INDEX "VisitorActivity_userId_idx" ON "VisitorActivity"("userId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_kind_idx" ON "Report"("kind");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- AddForeignKey
ALTER TABLE "ComboStar" ADD CONSTRAINT "ComboStar_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboStar" ADD CONSTRAINT "ComboStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
