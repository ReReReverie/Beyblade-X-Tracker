import { prisma } from "../../lib/prisma";

async function main() {
  console.log("Starting backfill of combo part IDs...");
  const combos = await prisma.combo.findMany({
    select: { id: true, parts: { select: { partId: true, role: true } } }
  });

  let updated = 0;

  for (const combo of combos) {
    const blade = combo.parts.find((p) => p.role === "BLADE")?.partId;
    const ratchet = combo.parts.find((p) => p.role === "RATCHET")?.partId;
    const bit = combo.parts.find((p) => p.role === "BIT")?.partId;

    // Only update if at least one denormalized field is present
    if (!blade && !ratchet && !bit) continue;

    const data: any = {};
    if (blade) data.bladePartId = blade;
    if (ratchet) data.ratchetPartId = ratchet;
    if (bit) data.bitPartId = bit;

    await prisma.combo.update({ where: { id: combo.id }, data });
    updated++;
  }

  console.log(`Backfill complete. Updated ${updated} combos.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
