import type {
  ExtendedChallongeMatchSnapshot,
  ExtendedChallongeStanding,
  ExtendedChallongeTournamentSnapshot
} from "./types";

/** Ensure participant fields have sensible defaults. */
export function normalizeParticipant(p: any): ExtendedChallongeStanding {
  return {
    id: p?.id ?? 0,
    name: typeof p?.name === "string" ? p.name : "",
    wins: typeof p?.wins === "number" ? p.wins : 0,
    losses: typeof p?.losses === "number" ? p.losses : 0,
    groupPlayerIds: Array.isArray(p?.groupPlayerIds) ? p.groupPlayerIds : undefined
  };
}

/** Ensure match fields have sensible defaults. */
export function normalizeMatch(m: any): ExtendedChallongeMatchSnapshot {
  return {
    id: m?.id ?? 0,
    player1Id: m?.player1Id ?? null,
    player2Id: m?.player2Id ?? null,
    winnerId: m?.winnerId ?? null,
    groupId: m?.groupId ?? null,
    scores: typeof m?.scores === "string" ? m.scores : null
  };
}

/** Normalize an entire tournament snapshot from raw JSON. */
export function normalizeSnapshot(raw: any): ExtendedChallongeTournamentSnapshot {
  if (!raw || typeof raw !== "object") return { participants: [], matches: [] };
  return {
    participants: Array.isArray(raw.participants)
      ? raw.participants.map(normalizeParticipant)
      : [],
    matches: Array.isArray(raw.matches)
      ? raw.matches.map(normalizeMatch)
      : []
  };
}

/** Build a map of participant ID → participant for quick lookup. */
export function buildParticipantMap(
  participants: ExtendedChallongeStanding[]
): Map<number | string, ExtendedChallongeStanding> {
  const map = new Map<number | string, ExtendedChallongeStanding>();
  for (const p of participants) {
    map.set(p.id, p);
  }
  return map;
}

/** Convert a 0-based group index to a letter (0 → "A", 1 → "B", etc.). */
export function getGroupLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
