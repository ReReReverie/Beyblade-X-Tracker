import type { Combo, ComboPart, Part } from "@prisma/client";

export type ComboWithParts = Combo & {
  parts: Array<ComboPart & { part: Part }>;
};

export function comboWeight(combo: ComboWithParts) {
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

export function comboCondition(combo: ComboWithParts) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}
