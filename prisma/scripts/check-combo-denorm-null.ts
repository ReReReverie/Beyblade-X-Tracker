import { prisma } from "../../lib/prisma";

async function main() {
  const totalRes: any = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Combo"`;
  const total = totalRes[0]?.count ?? 0;

  const missingRequiredRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "Combo" WHERE "bladePartId" IS NULL OR "bitPartId" IS NULL
  `;
  const missingRequired = missingRequiredRes[0]?.count ?? 0;

  const missingOptionalRatchetRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "Combo" WHERE "ratchetPartId" IS NULL
  `;
  const missingOptionalRatchet = missingOptionalRatchetRes[0]?.count ?? 0;

  const missingAllRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count FROM "Combo" WHERE "bladePartId" IS NULL AND "ratchetPartId" IS NULL AND "bitPartId" IS NULL
  `;
  const missingAll = missingAllRes[0]?.count ?? 0;

  console.log(`Total combos: ${total}`);
  console.log(`Combos missing required denorm fields: ${missingRequired}`);
  console.log(`Combos without optional ratchet denorm field: ${missingOptionalRatchet}`);
  console.log(`Combos missing all denorm fields: ${missingAll}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
