"use client";

import { Fragment, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest, getApiErrorMessage } from "@/lib/api-client";

async function sendJson(url: string, method: string, data?: unknown) {
  await apiRequest(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined
  });
}

type ApiUsage = {
  global: { used: number; limit: number; remaining: number };
  personal: { used: number; limit: number | null; remaining: number | null };
  resetsAt: string;
};

type ChallongeParticipant = {
  id: string;
  name: string;
  seed: number | null;
  finalRank: number | null;
  groupPlayerIds?: string[];
};

type ChallongeMatch = {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  groupId: string | null;
};

type ChallongeLookupResponse = {
  tournamentName?: string;
  participants?: ChallongeParticipant[];
  matches?: ChallongeMatch[];
  usage?: ApiUsage;
};

type ManualCareerEntry = {
  tournamentName: string;
  playedAt: string;
  placement: string;
  wins: string;
  losses: string;
  draws: string;
  notes: string;
};

const initialManualEntry: ManualCareerEntry = {
  tournamentName: "",
  playedAt: "",
  placement: "",
  wins: "0",
  losses: "0",
  draws: "0",
  notes: ""
};

function normalizeChallongeId(value: unknown) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function usageFromError(error: unknown) {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== "object" || !("usage" in error.body)) {
    return null;
  }
  const usage = (error.body as { usage?: unknown }).usage;
  return usage && typeof usage === "object" ? usage as ApiUsage : null;
}

function clearProfileCache() {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith("profile-cache:")) sessionStorage.removeItem(key);
    }
  } catch {}
}

export function ProfileEditForm({ name, image, bio }: { name?: string | null; image?: string | null; bio?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/profile", {
        method: "PATCH",
        body: form
      });
      clearProfileCache();
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Save failed."));
    }
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data">
      <h2>Edit profile</h2>
      <label>Display name<input name="name" defaultValue={name || ""} /></label>
      <label>Profile picture file<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      {image ? <p className="meta">Current image is already set. Upload a new file to replace it.</p> : null}
      <label>Short description<textarea name="bio" defaultValue={bio || ""} maxLength={280} /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save profile</button>
    </form>
  );
}

export function CareerEntryForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"manual" | "challonge">("manual");
  const [manualEntry, setManualEntry] = useState<ManualCareerEntry>(initialManualEntry);
  const [challongeUrl, setChallongeUrl] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [participants, setParticipants] = useState<ChallongeParticipant[]>([]);
  const [matches, setMatches] = useState<ChallongeMatch[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [apiUsage, setApiUsage] = useState<ApiUsage | null>(null);
  const safeManualEntry = manualEntry && typeof manualEntry === "object"
    ? { ...initialManualEntry, ...manualEntry }
    : initialManualEntry;
  const safeChallongeUrl = challongeUrl || "";
  const safeSelectedParticipant = selectedParticipant || "";

  useEffect(() => {
    if (mode === "challonge" && !apiUsage) {
      void apiRequest<ApiUsage>("/api/challonge/lookup").then(setApiUsage).catch(() => {});
    }
  }, [mode, apiUsage]);

  function resetChallonge() {
    setTournamentName("");
    setParticipants([]);
    setMatches([]);
    setSelectedParticipant("");
    setLookupDone(false);
    setError("");
  }

  async function lookupTournament() {
    const confirmed = window.confirm(
      "Is this tournament complete? Fetching it will use one of your monthly API requests."
    );
    if (!confirmed) return;

    setError("");
    setLookupLoading(true);
    resetChallonge();
    try {
      const data = await apiRequest<ChallongeLookupResponse>("/api/challonge/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: safeChallongeUrl })
      });
      const loadedParticipants = (data.participants || [])
        .filter((participant) => participant && participant.id && participant.name?.trim())
        .map((participant) => ({
          ...participant,
          id: String(participant.id),
          name: participant.name.trim()
        }));
      const loadedMatches = (data.matches || []).map((match) => ({
        ...match,
        id: String(match.id),
        player1Id: normalizeChallongeId(match.player1Id),
        player2Id: normalizeChallongeId(match.player2Id),
        winnerId: normalizeChallongeId(match.winnerId),
        groupId: normalizeChallongeId(match.groupId)
      }));
      setTournamentName(data.tournamentName || "");
      setParticipants(loadedParticipants);
      setMatches(loadedMatches);
      setLookupDone(true);
      if (!loadedParticipants.length) {
        setError("No participants found in this tournament.");
      }
      // Refresh usage counter
      void apiRequest<ApiUsage>("/api/challonge/lookup").then(setApiUsage).catch(() => {});
    } catch (err) {
      const usage = usageFromError(err);
      if (usage) setApiUsage((current) => current ? { ...current, ...usage } : usage);
      setError(getApiErrorMessage(err, "Lookup failed."));
    } finally {
      setLookupLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "challonge") {
      if (!selectedParticipant) {
        setError("Select a participant to track.");
        return;
      }
      // Compute wins/losses from matches
      const tracked = participants.find((p) => String(p.id) === selectedParticipant);
      if (!tracked) {
        setError("The selected participant is no longer available. Fetch the tournament again.");
        return;
      }
      let wins = 0;
      let losses = 0;
      for (const m of matches) {
        const isPlayer = m.player1Id === selectedParticipant || m.player2Id === selectedParticipant;
        if (!isPlayer || !m.winnerId) continue;
        if (m.winnerId === selectedParticipant) wins++;
        else losses++;
      }
      const placement = tracked?.finalRank ? String(tracked.finalRank) : undefined;

      const payload = {
        tournamentName,
        challongeUrl: safeChallongeUrl,
        trackedParticipantName: tracked.name,
        wins,
        losses,
        draws: 0,
        placement,
        playedAt: new Date().toISOString(),
        challongeSnapshot: {
          trackedParticipantId: safeSelectedParticipant,
          participants,
          matches
        }
      };

      try {
        await sendJson("/api/profile", "POST", payload);
        resetChallonge();
        setChallongeUrl("");
        setMode("manual");
        clearProfileCache();
        router.refresh();
      } catch (err) {
        setError(getApiErrorMessage(err, "Save failed."));
      }
      return;
    }

    // Manual mode
    try {
      await sendJson("/api/profile", "POST", manualEntry);
      setManualEntry(initialManualEntry);
      clearProfileCache();
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Save failed."));
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Add tournament</h2>
      <div className="dashboard-tabs" style={{ marginBottom: "0.5rem" }}>
        <button
          className={mode === "manual" ? "button button-small dashboard-tab dashboard-tab--active" : "button button-small secondary dashboard-tab"}
          type="button"
          onClick={() => { setMode("manual"); resetChallonge(); }}
        >
          Manual
        </button>
        <button
          className={mode === "challonge" ? "button button-small dashboard-tab dashboard-tab--active" : "button button-small secondary dashboard-tab"}
          type="button"
          onClick={() => setMode("challonge")}
        >
          Challonge
        </button>
      </div>

      {mode === "manual" ? (
        <Fragment key="manual">
          <label>Tournament<input name="tournamentName" value={safeManualEntry.tournamentName ?? ""} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), tournamentName: event.target.value }))} required /></label>
          <label>Date<input name="playedAt" type="date" value={safeManualEntry.playedAt ?? ""} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), playedAt: event.target.value }))} required /></label>
          <label>Placement<input name="placement" value={safeManualEntry.placement ?? ""} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), placement: event.target.value }))} placeholder="Top 8, 1st, 3-2 Swiss" /></label>
          <div className="form-grid">
            <label>Wins<input name="wins" type="number" min="0" value={safeManualEntry.wins ?? "0"} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), wins: event.target.value }))} /></label>
            <label>Losses<input name="losses" type="number" min="0" value={safeManualEntry.losses ?? "0"} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), losses: event.target.value }))} /></label>
            <label>Draws<input name="draws" type="number" min="0" value={safeManualEntry.draws ?? "0"} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), draws: event.target.value }))} /></label>
          </div>
          <label>Notes<textarea name="notes" value={safeManualEntry.notes ?? ""} onChange={(event) => setManualEntry((current) => ({ ...initialManualEntry, ...(current || {}), notes: event.target.value }))} /></label>
        </Fragment>
      ) : (
        <Fragment key="challonge">
          <div className="challonge-info" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
            {apiUsage ? (
              <>
                <p style={{ marginBottom: "0.4rem" }}>
                  <strong>All users: {apiUsage.global.used}/{apiUsage.global.limit} API requests this month</strong>
                  {apiUsage.global.remaining === 0 ? <span className="danger"> — All API requests have been used up for the month.</span> : null}
                </p>
                <p style={{ marginBottom: "0.4rem" }}>
                  <strong>
                    {apiUsage.personal.limit != null
                      ? `Your requests: ${apiUsage.personal.used}/${apiUsage.personal.limit} this month`
                      : `Your requests: ${apiUsage.personal.used} (unlimited)`
                    }
                  </strong>
                  {apiUsage.personal.remaining === 0 ? <span className="danger"> — personal limit reached</span> : null}
                </p>
              </>
            ) : null}
            <p className="meta" style={{ marginBottom: "0.3rem" }}>
              Each user is limited to <strong>5 Challonge lookups per month</strong>, with a shared limit of <strong>500 API requests per month</strong> for all users.
            </p>
            <details style={{ marginTop: "0.3rem" }}>
              <summary className="meta" style={{ cursor: "pointer" }}>Tips &amp; requirements</summary>
              <ul className="meta" style={{ paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
                <li>Your tournament must be <strong>public</strong> on Challonge (not set to private/invite-only).</li>
                <li>The tournament should be <strong>completed</strong> for final placements and full match data.</li>
                <li>Use the full URL, e.g. <code>https://challonge.com/your_tournament</code>.</li>
                <li>Community/subdomain URLs work too (e.g. <code>https://beybladeph.challonge.com/event</code>).</li>
                <li>After fetching, select the participant you want to track — wins, losses, and placement are calculated automatically.</li>
                <li>Double-check the participant name matches yours before saving.</li>
                <li>If you already saved this tournament manually, delete it first to avoid duplicates.</li>
              </ul>
            </details>
          </div>

          <label>
            Challonge URL
            <input
              value={safeChallongeUrl}
              onChange={(e) => setChallongeUrl(e.target.value)}
              placeholder="https://challonge.com/your_tournament"
              required
            />
          </label>
          <button
            className="button secondary button-small"
            type="button"
            onClick={lookupTournament}
            disabled={lookupLoading || !safeChallongeUrl.trim() || (apiUsage?.personal.remaining === 0) || (apiUsage?.global.remaining === 0)}
          >
            {lookupLoading ? "Looking up\u2026" : "Fetch tournament"}
          </button>

          {lookupDone ? (
            <>
              <div className="card" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
                <p><strong>{tournamentName || "Tournament loaded"}</strong></p>
                <p className="meta">{participants.length} participant{participants.length === 1 ? "" : "s"}</p>
              </div>

              {participants.length > 0 ? (
                <>
                  <label>
                    Track participant
                    <select
                      value={safeSelectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      required
                    >
                      <option value="">— Select who to track —</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.finalRank ? ` (placed ${p.finalRank})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="card" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
                    <p><strong>Players loaded from Challonge</strong></p>
                    <ul className="meta" style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
                      {participants.map((participant) => (
                        <li key={participant.id}>
                          {participant.name}
                          {participant.finalRank ? ` — placed ${participant.finalRank}` : participant.seed ? ` — seed ${participant.seed}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              {selectedParticipant ? (
                <div className="meta" style={{ marginTop: "0.25rem" }}>
                  Results will be calculated from match data automatically.
                </div>
              ) : null}
            </>
          ) : null}
        </Fragment>
      )}

      {error ? <p className="danger">{error}</p> : null}
      <button type="submit" disabled={mode === "challonge" && (!lookupDone || !selectedParticipant)}>
        Save tournament
      </button>
    </form>
  );
}

export function CareerDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function remove() {
    setError("");
    setLoading(true);
    try {
      await sendJson(`/api/profile?id=${encodeURIComponent(id)}`, "DELETE");
      clearProfileCache();
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Delete failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="delete-control delete-control--compact">
      <button className="button button-small button-danger" type="button" onClick={remove} disabled={loading}>
        {loading ? "Deleting\u2026" : "Delete"}
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}

