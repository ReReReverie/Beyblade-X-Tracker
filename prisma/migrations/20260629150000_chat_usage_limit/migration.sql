CREATE TABLE "ChatUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatUsage_userId_day_key" ON "ChatUsage"("userId", "day");
CREATE INDEX "ChatUsage_day_idx" ON "ChatUsage"("day");

ALTER TABLE "ChatUsage" ADD CONSTRAINT "ChatUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
