import type { Battle } from "@prisma/client";

export type BattlePoint = Pick<Battle, "id" | "comboAId" | "comboBId" | "winnerId" | "playedAt">;

export function battlesForCombo(comboId: string, battles: BattlePoint[]) {
  return battles
    .filter((battle) => battle.comboAId === comboId || battle.comboBId === comboId)
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
}
