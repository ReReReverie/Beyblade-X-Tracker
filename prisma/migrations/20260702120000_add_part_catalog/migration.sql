-- CreateTable
CREATE TABLE "PartCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartType" NOT NULL,
    "manufacturer" "Manufacturer" NOT NULL DEFAULT 'TAKARA_TOMY',
    "weightGrams" DECIMAL(6,2) NOT NULL,
    "imageUrl" TEXT,
    "metaTier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCatalog_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Part" ADD COLUMN "catalogPartId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalog_slug_key" ON "PartCatalog"("slug");

-- CreateIndex
CREATE INDEX "PartCatalog_type_idx" ON "PartCatalog"("type");

-- CreateIndex
CREATE INDEX "PartCatalog_metaTier_idx" ON "PartCatalog"("metaTier");

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalog_name_type_key" ON "PartCatalog"("name", "type");

-- CreateIndex
CREATE INDEX "Part_catalogPartId_idx" ON "Part"("catalogPartId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_catalogPartId_fkey" FOREIGN KEY ("catalogPartId") REFERENCES "PartCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
