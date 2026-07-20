/**
 * Client-safe combo stat helpers.
 * These mirror the functions in lib/stats.ts but avoid importing from @prisma/client
 * so they can be safely bundled in "use client" components.
 */

type PartEntry = {
  part: { weightGrams?: number | string | null; conditionRating?: number | string | null };
};

type ComboLike = {
  parts: PartEntry[];
};

export function comboWeight(combo: ComboLike): number | null {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

export function comboCondition(combo: ComboLike): number {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}
