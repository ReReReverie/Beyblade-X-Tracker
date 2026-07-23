"use client";

interface ChallongeParticipant {
  id: string;
  name: string;
  wins: number;
  losses: number;
  groupPlayerIds?: (number | string)[];
}

interface ChallongeMatch {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  groupId: string | null;
  scores: string | null;
}

interface ChallongeSnapshot {
  trackedParticipantId?: string | null;
  participants?: ChallongeParticipant[];
  matches?: ChallongeMatch[];
}

interface ChallongeResultsDisplayProps {
  snapshot: ChallongeSnapshot | null | undefined;
  trackedParticipantName: string | null | undefined;
  challongeUrl: string | null | undefined;
  placement: string | null | undefined;
  wins?: number | null;
  losses?: number | null;
}

function normalizeParticipant(p: unknown): ChallongeParticipant {
  const participant = p && typeof p === "object" ? p as Record<string, unknown> : {};
  return {
    id: participant.id == null ? "" : String(participant.id),
    name: typeof participant.name === "string" ? participant.name : "",
    wins: typeof participant.wins === "number" ? participant.wins : 0,
    losses: typeof participant.losses === "number" ? participant.losses : 0,
    groupPlayerIds: Array.isArray(participant.groupPlayerIds)
      ? participant.groupPlayerIds.map((id: unknown) => String(id))
      : undefined
  };
}

function normalizeMatch(m: unknown): ChallongeMatch {
  const match = m && typeof m === "object" ? m as Record<string, unknown> : {};
  return {
    id: match.id == null ? "" : String(match.id),
    player1Id: match.player1Id == null ? null : String(match.player1Id),
    player2Id: match.player2Id == null ? null : String(match.player2Id),
    winnerId: match.winnerId == null ? null : String(match.winnerId),
    groupId: match.groupId == null ? null : String(match.groupId),
    scores: typeof match.scores === "string" ? match.scores : null
  };
}

function normalizeSnapshot(raw: unknown): { trackedParticipantId: string | null; participants: ChallongeParticipant[]; matches: ChallongeMatch[] } {
  if (!raw || typeof raw !== "object") return { trackedParticipantId: null, participants: [], matches: [] };
  const snapshot = raw as Record<string, unknown>;
  return {
    trackedParticipantId: snapshot.trackedParticipantId == null ? null : String(snapshot.trackedParticipantId),
    participants: Array.isArray(snapshot.participants) ? snapshot.participants.map(normalizeParticipant) : [],
    matches: Array.isArray(snapshot.matches) ? snapshot.matches.map(normalizeMatch) : []
  };
}

function computeOverallRecord(trackedId: string, matches: ChallongeMatch[]) {
  let wins = 0;
  let losses = 0;
  for (const match of matches) {
    const isPlayer = match.player1Id === trackedId || match.player2Id === trackedId;
    if (!isPlayer || match.winnerId == null) continue;
    if (match.winnerId === trackedId) wins++;
    else losses++;
  }
  return { wins, losses };
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
  id: string;
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
  trackedId: string,
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
      const groupPlayerIds = new Set<string>();
      for (const m of groupMatches) {
        if (m.groupId === groupId) {
          if (m.player1Id != null) groupPlayerIds.add(m.player1Id);
          if (m.player2Id != null) groupPlayerIds.add(m.player2Id);
        }
      }

      // Compute W/L per player from group matches in this specific group
      const wlMap = new Map<string, { wins: number; losses: number }>();
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
  placement,
  wins,
  losses
}: ChallongeResultsDisplayProps) {
  const normalized = normalizeSnapshot(snapshot);
  const participants = normalized.participants;
  const matches = normalized.matches;

  const trackedById = normalized.trackedParticipantId
    ? participants.find((p) => p.id === normalized.trackedParticipantId)
    : null;
  const normalizedTrackedName = typeof trackedParticipantName === "string"
    ? trackedParticipantName.trim().toLowerCase()
    : "";
  const tracked = trackedById || (normalizedTrackedName
    ? participants.find((p) => p.name.toLowerCase() === normalizedTrackedName)
    : null);

  // A legacy snapshot may retain the tracked ID while omitting its participant
  // entry; the ID is still enough to calculate the record from match results.
  const trackedId = tracked?.id || normalized.trackedParticipantId;
  const overallRecord = trackedId ? computeOverallRecord(trackedId, matches) : { wins: 0, losses: 0 };
  const overallWins = typeof wins === "number" ? wins : overallRecord.wins || tracked?.wins || 0;
  const overallLosses = typeof losses === "number" ? losses : overallRecord.losses || tracked?.losses || 0;
  const isPending = overallWins === 0 && overallLosses === 0;

  const stageResult = trackedId ? computeStageResults(trackedId, participants, matches, placement) : null;
  const groupLabel = typeof stageResult?.groupLabel === "string" ? stageResult.groupLabel : null;
  const groupStandings: GroupStandingEntry[] = Array.isArray(stageResult?.groupStandings)
    ? stageResult.groupStandings
    : [];
  const groupRank = typeof stageResult?.groupRank === "number" ? stageResult.groupRank : 0;
  const finalsWins = typeof stageResult?.finalsWins === "number" ? stageResult.finalsWins : 0;
  const finalsLosses = typeof stageResult?.finalsLosses === "number" ? stageResult.finalsLosses : 0;
  const finalStanding = typeof stageResult?.finalStanding === "string" && stageResult.finalStanding.trim()
    ? stageResult.finalStanding
    : placement || "Pending";

  const hasGroupStage = Boolean(groupLabel && groupStandings.length > 0);
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

      {!snapshot ? <p className="meta">Tournament data has not synced yet.</p> : null}
      {snapshot && !tracked ? <p className="meta">Tracked participant not found in tournament data.</p> : null}

      {(hasGroupStage || hasFinalsMatches || finalStanding !== "Pending") ? (
        <details className="challonge-results__details">
          <summary>Show final standings and match details</summary>

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
        </details>
      ) : null}

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
