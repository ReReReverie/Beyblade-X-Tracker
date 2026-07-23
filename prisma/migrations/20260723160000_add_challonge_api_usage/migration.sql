CREATE TABLE "ChallongeApiUsage" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallongeApiUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChallongeApiUsage_month_userId_key" ON "ChallongeApiUsage"("month", "userId");
CREATE INDEX "ChallongeApiUsage_userId_month_idx" ON "ChallongeApiUsage"("userId", "month");
