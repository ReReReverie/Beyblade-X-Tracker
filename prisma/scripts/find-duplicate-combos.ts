import { prisma } from "../../lib/prisma";

async function main() {
  const duplicates = await prisma.$queryRaw`
    SELECT "ownerId", "bladePartId", "ratchetPartId", "bitPartId", COUNT(*)
    FROM "Combo"
    GROUP BY "ownerId", "bladePartId", "ratchetPartId", "bitPartId"
    HAVING COUNT(*) > 1
  `;

  console.log("Duplicates:", duplicates);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
