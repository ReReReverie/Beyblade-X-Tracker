"use client";

interface ChallongeParticipant {
  id: number | string;
  name: string;
  wins: number;
  losses: number;
  groupPlayerIds?: (number | string)[];
}

interface ChallongeMatch {
  id: number | string;
  player1Id: number | string | null;
  player2Id: number | string | null;
  winnerId: number | string | null;
  groupId: number | string | null;
  scores: string | null;
}

interface ChallongeSnapshot {
  participants?: ChallongeParticipant[];
  matches?: ChallongeMatch[];
}

interface ChallongeResultsDisplayProps {
  snapshot: ChallongeSnapshot | null | undefined;
  trackedParticipantName: string | null | undefined;
  challongeUrl: string | null | undefined;
  placement: string | null | undefined;
}

function normalizeParticipant(p: any): ChallongeParticipant {
  return {
    id: p?.id ?? 0,
    name: typeof p?.name === "string" ? p.name : "",
    wins: typeof p?.wins === "number" ? p.wins : 0,
    losses: typeof p?.losses === "number" ? p.losses : 0,
    groupPlayerIds: Array.isArray(p?.groupPlayerIds) ? p.groupPlayerIds : undefined
  };
}

function normalizeMatch(m: any): ChallongeMatch {
  return {
    id: m?.id ?? 0,
    player1Id: m?.player1Id ?? null,
    player2Id: m?.player2Id ?? null,
    winnerId: m?.winnerId ?? null,
    groupId: m?.groupId ?? null,
    scores: typeof m?.scores === "string" ? m.scores : null
  };
}

function normalizeSnapshot(raw: any): { participants: ChallongeParticipant[]; matches: ChallongeMatch[] } {
  if (!raw || typeof raw !== "object") return { participants: [], matches: [] };
  return {
    participants: Array.isArray(raw.participants) ? raw.participants.map(normalizeParticipant) : [],
    matches: Array.isArray(raw.matches) ? raw.matches.map(normalizeMatch) : []
  };
}

function getGroupLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface GroupStandingEntry {
  id: number | string;
  name: string;
  wins: number;
  losses: number;
  isTracked: boolean;
}

interface StageResult {
  groupLabel: string | null;
  groupStandings: GroupStandingEntry[];
  groupRank: number;
  finalsWins: number;
  finalsLosses: number;
  finalStanding: string;
}

function computeStageResults(
  trackedId: number | string,
  participants: ChallongeParticipant[],
  matches: ChallongeMatch[],
  placement: string | null | undefined
): StageResult {
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const groupMatches = matches.filter((m) => m.groupId != null);
  const finalsMatches = matches.filter((m) => m.groupId == null);

  let groupLabel: string | null = null;
  let groupStandings: GroupStandingEntry[] = [];
  let groupRank = 0;

  // --- Group stage analysis ---
  if (groupMatches.length > 0) {
    const participantGroupMatch = groupMatches.find(
      (m) => m.player1Id === trackedId || m.player2Id === trackedId
    );

    if (participantGroupMatch) {
      const groupId = participantGroupMatch.groupId;
      const uniqueGroupIds = [...new Set(groupMatches.map((m) => m.groupId))].sort();
      const groupIndex = uniqueGroupIds.indexOf(groupId);
      groupLabel = `Group ${getGroupLetter(groupIndex >= 0 ? groupIndex : 0)}`;

      // Collect all players in this group
      const groupPlayerIds = new Set<number | string>();
      for (const m of groupMatches) {
        if (m.groupId === groupId) {
          if (m.player1Id != null) groupPlayerIds.add(m.player1Id);
          if (m.player2Id != null) groupPlayerIds.add(m.player2Id);
        }
      }

      // Compute W/L per player from group matches in this specific group
      const wlMap = new Map<number | string, { wins: number; losses: number }>();
      for (const pid of groupPlayerIds) {
        wlMap.set(pid, { wins: 0, losses: 0 });
      }
      for (const m of groupMatches) {
        if (m.groupId !== groupId) continue;
        if (m.winnerId == null) continue;
        const loserId = m.player1Id === m.winnerId ? m.player2Id : m.player1Id;
        const winnerEntry = wlMap.get(m.winnerId);
        if (winnerEntry) winnerEntry.wins++;
        if (loserId != null) {
          const loserEntry = wlMap.get(loserId);
          if (loserEntry) loserEntry.losses++;
        }
      }

      // Build standings sorted by wins desc, losses asc
      groupStandings = [...groupPlayerIds]
        .map((id) => {
          const p = participantMap.get(id);
          const wl = wlMap.get(id) || { wins: 0, losses: 0 };
          return {
            id,
            name: p?.name || `Player ${id}`,
            wins: wl.wins,
            losses: wl.losses,
            isTracked: id === trackedId
          };
        })
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

      groupRank = groupStandings.findIndex((p) => p.id === trackedId) + 1;
    }
  }

  // --- Finals stage analysis ---
  let finalsWins = 0;
  let finalsLosses = 0;

  for (const m of finalsMatches) {
    const isPlayer = m.player1Id === trackedId || m.player2Id === trackedId;
    if (!isPlayer || m.winnerId == null) continue;
    if (m.winnerId === trackedId) finalsWins++;
    else finalsLosses++;
  }

  const finalStanding = placement || "Pending";

  return { groupLabel, groupStandings, groupRank, finalsWins, finalsLosses, finalStanding };
}

export function ChallongeResultsDisplay({
  snapshot,
  trackedParticipantName,
  challongeUrl,
  placement
}: ChallongeResultsDisplayProps) {
  if (!snapshot) {
    return <p className="meta">Tournament data has not synced yet.</p>;
  }

  const normalized = normalizeSnapshot(snapshot);
  const participants = normalized.participants;
  const matches = normalized.matches;

  const tracked = trackedParticipantName
    ? participants.find((p) => p.name.toLowerCase() === trackedParticipantName.toLowerCase())
    : null;

  if (!tracked) {
    return <p className="meta">Tracked participant not found in tournament data.</p>;
  }

  const overallWins = tracked.wins;
  const overallLosses = tracked.losses;
  const isPending = overallWins === 0 && overallLosses === 0;

  const { groupLabel, groupStandings, groupRank, finalsWins, finalsLosses, finalStanding } =
    computeStageResults(tracked.id, participants, matches, placement);

  const hasGroupStage = groupLabel && groupStandings.length > 0;
  const hasFinalsMatches = finalsWins > 0 || finalsLosses > 0;

  return (
    <div className="challonge-results">
      {/* Overall record */}
      <div className="career-result">
        <span className="meta">Overall Record</span>
        <strong>
          {overallWins}W - {overallLosses}L
          {isPending ? <span className="meta"> (pending)</span> : null}
        </strong>
      </div>

      {/* Group stage standings */}
      {hasGroupStage ? (
        <div className="career-stage-section">
          <div className="career-result">
            <span className="meta">{groupLabel} — Standings</span>
            <strong>{getOrdinal(groupRank)} place</strong>
          </div>
          <table className="career-standings-table" aria-label={`${groupLabel} standings`}>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>W</th>
                <th>L</th>
              </tr>
            </thead>
            <tbody>
              {groupStandings.map((entry, i) => (
                <tr key={String(entry.id)} className={entry.isTracked ? "career-standings-highlight" : ""}>
                  <td>{i + 1}</td>
                  <td>{entry.name}{entry.isTracked ? " ★" : ""}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Finals stage results */}
      {hasFinalsMatches ? (
        <div className="career-stage-section">
          <div className="career-result">
            <span className="meta">Finals Stage — Record</span>
            <strong>{finalsWins}W - {finalsLosses}L</strong>
          </div>
        </div>
      ) : null}

      {/* Final standing */}
      <div className="career-result">
        <span className="meta">Final Standing</span>
        <strong>{finalStanding}</strong>
      </div>

      {challongeUrl ? (
        <a
          className="button secondary button-small"
          href={challongeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View full bracket on Challonge
        </a>
      ) : null}
    </div>
  );
}
