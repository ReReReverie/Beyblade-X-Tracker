import { prisma } from "../lib/prisma";
import { metaParts } from "./data/meta-parts";

export async function seedCatalog() {
  let created = 0;
  let updated = 0;

  for (const part of metaParts) {
    const existing = await prisma.partCatalog.findUnique({ where: { slug: part.slug } });
    await prisma.partCatalog.upsert({
      where: { slug: part.slug },
      update: {
        name: part.name,
        type: part.type,
        manufacturer: part.manufacturer,
        weightGrams: part.weightGrams,
        imageUrl: null,
        metaTier: part.metaTier,
        notes: part.notes
      },
      create: {
        slug: part.slug,
        name: part.name,
        type: part.type,
        manufacturer: part.manufacturer,
        weightGrams: part.weightGrams,
        metaTier: part.metaTier,
        notes: part.notes
      }
    });
    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, total: metaParts.length };
}

async function main() {
  const result = await seedCatalog();
  console.log(`Meta parts catalog: ${result.total} entries (${result.created} new, ${result.updated} updated)`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
