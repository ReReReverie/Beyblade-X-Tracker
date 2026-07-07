import type { Battle } from "@prisma/client";

export type BattlePoint = Omit<Pick<Battle, "id" | "comboAId" | "comboBId" | "winnerId" | "playedAt">, "playedAt"> & {
  playedAt: Date | string;
};

export function battleTime(battle: BattlePoint) {
  return battle.playedAt instanceof Date ? battle.playedAt.getTime() : new Date(battle.playedAt).getTime();
}

export function battlesForCombo(comboId: string, battles: BattlePoint[]) {
  return battles
    .filter((battle) => battle.comboAId === comboId || battle.comboBId === comboId)
    .sort((a, b) => battleTime(a) - battleTime(b));
}
