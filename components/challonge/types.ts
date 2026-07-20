/** Snapshot of a single participant in a Challonge tournament. */
export interface ExtendedChallongeStanding {
  id: number | string;
  name: string;
  wins: number;
  losses: number;
  groupPlayerIds?: (number | string)[];
}

/** Snapshot of a single match in a Challonge tournament. */
export interface ExtendedChallongeMatchSnapshot {
  id: number | string;
  player1Id: number | string | null;
  player2Id: number | string | null;
  winnerId: number | string | null;
  groupId: number | string | null;
  scores: string | null;
}

/** Full tournament snapshot stored in the database as JSON. */
export interface ExtendedChallongeTournamentSnapshot {
  participants?: ExtendedChallongeStanding[];
  matches?: ExtendedChallongeMatchSnapshot[];
}
