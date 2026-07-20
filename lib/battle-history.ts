export type BattlePoint = {
  id: string;
  comboAId: string | null;
  comboBId: string | null;
  winnerId: string | null;
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
