import { readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";

type CountRow = { count: number };
type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };

const expectedTables = [
  "User", "Account", "Session", "VerificationToken", "PartCatalog", "Part", "PartPhoto",
  "Combo", "ComboPart", "ComboPhoto", "ComboStar", "ComboPut", "ComboComment",
  "FeaturedCombo", "Deck", "DeckSlot", "Battle", "CareerEntry", "ChatUsage",
  "VisitorActivity", "Report", "ChallongeApiUsage", "RateLimitBucket"
];

const failures: string[] = [];
const warnings: string[] = [];

function countValue(rows: CountRow[]) {
  return Number(rows[0]?.count ?? 0);
}

async function count(query: ReturnType<typeof prisma.$queryRaw>) {
  const rows = await query as CountRow[];
  return countValue(rows);
}

async function checkMigrations() {
  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const migrationDirectories = (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const appliedRows = await prisma.$queryRaw<MigrationRow[]>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `;
  const applied = new Set(appliedRows.filter((row) => row.finished_at).map((row) => row.migration_name));
  const failed = appliedRows
    .filter((row) => !row.finished_at && !row.rolled_back_at)
    .map((row) => row.migration_name);
  if (failed.length) failures.push(`Failed migrations: ${failed.join(", ")}`);
  const missing = migrationDirectories.filter((name) => !applied.has(name));
  if (missing.length) failures.push(`Unapplied migrations: ${missing.join(", ")}`);
  console.log(`Migrations: ${applied.size}/${migrationDirectories.length} applied`);
}

async function checkSchema() {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = current_schema()
  `;
  const actualTables = new Set(rows.map((row) => row.tablename));
  const missing = expectedTables.filter((table) => !actualTables.has(table));
  if (missing.length) failures.push(`Missing tables: ${missing.join(", ")}`);
  console.log(`Schema tables: ${expectedTables.length - missing.length}/${expectedTables.length} present`);
}

async function checkIntegrity() {
  const orphanComboParts = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "ComboPart" cp
    LEFT JOIN "Combo" c ON c.id = cp."comboId"
    LEFT JOIN "Part" p ON p.id = cp."partId"
    WHERE c.id IS NULL OR p.id IS NULL
  `);
  if (orphanComboParts) failures.push(`Orphaned combo-part rows: ${orphanComboParts}`);

  const invalidBattleFormats = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "Battle"
    WHERE ("format" = 'ONE_V_ONE' AND ("comboAId" IS NULL OR "comboBId" IS NULL))
       OR ("format" = 'THREE_V_THREE' AND ("deckAId" IS NULL OR "deckBId" IS NULL))
  `);
  if (invalidBattleFormats) failures.push(`Invalid battle format records: ${invalidBattleFormats}`);

  const invalidComboWinners = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "Battle"
    WHERE "winnerId" IS NOT NULL
      AND "winnerId" <> COALESCE("comboAId", '')
      AND "winnerId" <> COALESCE("comboBId", '')
  `);
  if (invalidComboWinners) failures.push(`Battles with invalid combo winners: ${invalidComboWinners}`);

  const invalidDeckWinners = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "Battle"
    WHERE "deckWinnerId" IS NOT NULL
      AND "deckWinnerId" <> COALESCE("deckAId", '')
      AND "deckWinnerId" <> COALESCE("deckBId", '')
  `);
  if (invalidDeckWinners) failures.push(`Battles with invalid deck winners: ${invalidDeckWinners}`);

  const denormMismatches = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "Combo" c
    WHERE NOT EXISTS (
      SELECT 1 FROM "ComboPart" cp
      WHERE cp."comboId" = c.id AND cp.role = 'BLADE' AND cp."partId" = c."bladePartId"
    )
       OR (c."ratchetPartId" IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM "ComboPart" cp
         WHERE cp."comboId" = c.id AND cp.role = 'RATCHET' AND cp."partId" = c."ratchetPartId"
       ))
       OR NOT EXISTS (
         SELECT 1 FROM "ComboPart" cp
         WHERE cp."comboId" = c.id AND cp.role = 'BIT' AND cp."partId" = c."bitPartId"
       )
  `);
  if (denormMismatches) failures.push(`Combo denormalized part mismatches: ${denormMismatches}`);

  const duplicateSignatures = await count(prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT "ownerId", "bladePartId", "ratchetPartId", "bitPartId"
      FROM "Combo"
      GROUP BY "ownerId", "bladePartId", "ratchetPartId", "bitPartId"
      HAVING COUNT(*) > 1
    ) duplicates
  `);
  if (duplicateSignatures) warnings.push(`Duplicate combo signatures: ${duplicateSignatures}`);
  console.log("Integrity checks: complete");
}

async function printCounts() {
  const tables = ["User", "Part", "Combo", "Battle", "Deck", "RateLimitBucket"];
  const counts = await Promise.all(tables.map(async (table) => {
    const result = await prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return [table, countValue(result)] as const;
  }));
  console.log("Row counts:", Object.fromEntries(counts));
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection: ok");
  await checkMigrations();
  await checkSchema();
  await checkIntegrity();
  await printCounts();

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  if (failures.length) {
    for (const failure of failures) console.error(`Failure: ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("Database health check: passed");
  }
}

main()
  .catch((error) => {
    console.error("Database health check failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
