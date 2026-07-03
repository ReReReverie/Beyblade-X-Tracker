import { prisma } from "../../lib/prisma";

async function main() {
  const notNulls = await prisma.$queryRaw`
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_name='Combo' AND column_name IN ('bladePartId','ratchetPartId','bitPartId')
  `;

  const indexes = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename='Combo'
  `;

  console.log('Not-null info:', notNulls);
  console.log('Indexes:', indexes);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
