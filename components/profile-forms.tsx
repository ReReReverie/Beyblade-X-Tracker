"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

async function sendJson(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Save failed.");
  }
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
      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: form
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Save failed.");
      }
      clearProfileCache();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
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
  const [challongeUrl, setChallongeUrl] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [participants, setParticipants] = useState<{ id: string; name: string; finalRank: number | null }[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [apiUsage, setApiUsage] = useState<{ global: { used: number; limit: number; remaining: number }; personal: { used: number; limit: number | null; remaining: number | null }; resetsAt: string } | null>(null);

  useEffect(() => {
    if (mode === "challonge" && !apiUsage) {
      fetch("/api/challonge/lookup").then(r => r.json()).then(setApiUsage).catch(() => {});
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
    setError("");
    setLookupLoading(true);
    resetChallonge();
    try {
      const res = await fetch("/api/challonge/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: challongeUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setTournamentName(data.tournamentName || "");
      setParticipants(data.participants || []);
      setMatches(data.matches || []);
      setLookupDone(true);
      if (!data.participants?.length) {
        setError("No participants found in this tournament.");
      }
      // Refresh usage counter
      fetch("/api/challonge/lookup").then(r => r.json()).then(setApiUsage).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;

    if (mode === "challonge") {
      if (!selectedParticipant) {
        setError("Select a participant to track.");
        return;
      }
      // Compute wins/losses from matches
      const tracked = participants.find((p) => p.id === selectedParticipant);
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
        challongeUrl,
        trackedParticipantName: tracked?.name || "",
        wins,
        losses,
        draws: 0,
        placement,
        playedAt: new Date().toISOString(),
        challongeSnapshot: { participants, matches }
      };

      try {
        await sendJson("/api/profile", "POST", payload);
        formElement.reset();
        resetChallonge();
        setChallongeUrl("");
        setMode("manual");
        clearProfileCache();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
      return;
    }

    // Manual mode
    const form = new FormData(formElement);
    try {
      await sendJson("/api/profile", "POST", Object.fromEntries(form));
      formElement.reset();
      clearProfileCache();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
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
        <>
          <label>Tournament<input name="tournamentName" required /></label>
          <label>Date<input name="playedAt" type="date" required defaultValue="" /></label>
          <label>Placement<input name="placement" placeholder="Top 8, 1st, 3-2 Swiss" /></label>
          <div className="form-grid">
            <label>Wins<input name="wins" type="number" min="0" defaultValue="0" /></label>
            <label>Losses<input name="losses" type="number" min="0" defaultValue="0" /></label>
            <label>Draws<input name="draws" type="number" min="0" defaultValue="0" /></label>
          </div>
          <label>Notes<textarea name="notes" /></label>
        </>
      ) : (
        <>
          <div className="challonge-info" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
            {apiUsage ? (
              <p style={{ marginBottom: "0.4rem" }}>
                <strong>
                  {apiUsage.personal.limit != null
                    ? `Your requests: ${apiUsage.personal.used}/${apiUsage.personal.limit} this month`
                    : `Your requests: ${apiUsage.personal.used} (unlimited)`
                  }
                </strong>
                {apiUsage.personal.remaining === 0 ? <span className="danger"> — limit reached</span> : null}
              </p>
            ) : null}
            <p className="meta" style={{ marginBottom: "0.3rem" }}>
              Each user is limited to <strong>5 Challonge lookups per month</strong> to accommodate all users fairly. Need more? Contact an admin — extra requests depend on overall monthly usage.
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
              value={challongeUrl}
              onChange={(e) => setChallongeUrl(e.target.value)}
              placeholder="https://challonge.com/your_tournament"
              required
            />
          </label>
          <button
            className="button secondary button-small"
            type="button"
            onClick={lookupTournament}
            disabled={lookupLoading || !challongeUrl.trim() || (apiUsage?.personal.remaining === 0) || (apiUsage?.global.remaining === 0)}
          >
            {lookupLoading ? "Looking up\u2026" : "Fetch tournament"}
          </button>

          {lookupDone && tournamentName ? (
            <>
              <div className="card" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
                <p><strong>{tournamentName}</strong></p>
                <p className="meta">{participants.length} participant{participants.length === 1 ? "" : "s"}</p>
              </div>

              {participants.length > 0 ? (
                <label>
                  Track participant
                  <select
                    value={selectedParticipant}
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
              ) : null}

              {selectedParticipant ? (
                <div className="meta" style={{ marginTop: "0.25rem" }}>
                  Results will be calculated from match data automatically.
                </div>
              ) : null}
            </>
          ) : null}
        </>
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
      setError(err instanceof Error ? err.message : "Delete failed.");
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

