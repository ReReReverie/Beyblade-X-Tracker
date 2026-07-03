import { prisma } from "../../lib/prisma";

async function main() {
  const totalRes: any = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Combo"`;
  const total = totalRes[0]?.count ?? 0;

  const missingAnyRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "Combo" WHERE "bladePartId" IS NULL OR "ratchetPartId" IS NULL OR "bitPartId" IS NULL
  `;
  const missingAny = missingAnyRes[0]?.count ?? 0;

  const missingAllRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "Combo" WHERE "bladePartId" IS NULL AND "ratchetPartId" IS NULL AND "bitPartId" IS NULL
  `;
  const missingAll = missingAllRes[0]?.count ?? 0;

  console.log(`Total combos: ${total}`);
  console.log(`Combos missing any denorm field: ${missingAny}`);
  console.log(`Combos missing all denorm fields: ${missingAll}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
