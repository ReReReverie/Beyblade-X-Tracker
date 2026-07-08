"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CareerDeleteButton, CareerEntryForm, ProfileEditForm } from "@/components/profile-forms";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, formatVisibility, pct } from "@/lib/format";
import type { ProfileTab } from "@/lib/profile-data";
import { comboCondition, comboWeight } from "@/lib/stats";

type ProfilePayload = {
  user: { id: string; name?: string | null; username?: string | null; email?: string | null; image?: string | null; bio?: string | null };
  stats: { comboCount: number; putCount: number; careerCount: number };
  myCombos?: any[];
  starredCombos?: any[];
  putCombos?: any[];
  careerEntries?: any[];
};

type ProfileTabPayload = Partial<Omit<ProfilePayload, "user" | "stats">> & {
  user?: Partial<ProfilePayload["user"]>;
  stats?: ProfilePayload["stats"];
};

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "posts", label: "Posts" },
  { id: "starred", label: "Starred" },
  { id: "lineup", label: "Lineup" },
  { id: "career", label: "Career" }
];

const cacheVersion = "v3";
const ttlMs = 5 * 60 * 1000;

function cacheKey(userId: string, tab: ProfileTab) {
  return `profile-cache:${cacheVersion}:${userId}:${tab}`;
}

function readCache(userId: string, tab: ProfileTab): ProfileTabPayload | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId, tab));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; data: ProfileTabPayload };
    if (Date.now() - parsed.savedAt > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(userId: string, tab: ProfileTab, data: ProfileTabPayload) {
  try {
    sessionStorage.setItem(cacheKey(userId, tab), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {}
}

function mergeProfilePayload(current: ProfilePayload, incoming: ProfileTabPayload): ProfilePayload {
  return {
    ...current,
    user: incoming.user ? { ...current.user, ...incoming.user } : current.user,
    stats: incoming.stats || current.stats,
    myCombos: incoming.myCombos ?? current.myCombos,
    starredCombos: incoming.starredCombos ?? current.starredCombos,
    putCombos: incoming.putCombos ?? current.putCombos,
    careerEntries: incoming.careerEntries ?? current.careerEntries
  };
}

function ComboList({ combos, userId, empty }: { combos: any[]; userId: string; empty: string }) {
  if (!combos.length) return <p className="meta">{empty}</p>;

  return (
    <div className="grid">
      {combos.map((combo) => {
        const wins = combo._count?.wins ?? combo.wins?.length ?? 0;
        const battlesA = combo._count?.battlesA ?? combo.battlesA?.length ?? 0;
        const battlesB = combo._count?.battlesB ?? combo.battlesB?.length ?? 0;
        const total = battlesA + battlesB;
        const comboWeightValue = comboWeight(combo);
        return (
          <div className="card" key={combo.id}>
            {combo.photos?.[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
            <Link href={`/combos/${combo.id}`} prefetch={false}><h3>{combo.name}</h3></Link>
            <p className="meta">Creator: {combo.owner?.name || combo.owner?.username || "Unknown"}</p>
            <p className="meta">
              {comboWeightValue !== null ? `${comboWeightValue.toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
            </p>
            <p className="meta">
              {combo.parts.map((entry: any) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
            </p>
            <StarButton comboId={combo.id} initialCount={combo._count?.stars ?? combo.stars?.length ?? 0} initiallyStarred={combo.stars?.some((star: any) => star.userId === userId)} />
            <PutComboButton comboId={combo.id} initialCount={combo._count?.puts ?? combo.puts?.length ?? 0} initiallyPut={combo.puts?.some((put: any) => put.userId === userId) || Boolean(combo.puts?.length)} />
          </div>
        );
      })}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="list profile-tab-loading" aria-live="polite">
      <p className="meta">Loading profile data...</p>
      <div className="card" aria-hidden="true" />
    </div>
  );
}

export function ProfileClient({
  initialData,
  initialTab,
  sessionName,
  initialReady = true
}: {
  initialData: ProfilePayload;
  initialTab: ProfileTab;
  sessionName?: string | null;
  initialReady?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [data, setData] = useState<ProfilePayload>(initialData);
  const [loadedTabs, setLoadedTabs] = useState<Set<ProfileTab>>(() => new Set(initialReady ? [initialTab] : []));
  const [loading, setLoading] = useState(!initialReady);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const userId = initialData.user.id;

  async function loadTab(tab: ProfileTab) {
    const cached = readCache(userId, tab);
    if (cached) {
      setData((current) => mergeProfilePayload(current, cached));
      setLoadedTabs((current) => new Set(current).add(tab));
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/profile?tab=${tab}&partial=1`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Could not load profile data.");
      const fresh = (await response.json()) as ProfileTabPayload;
      if (controller.signal.aborted) return;
      setData((current) => mergeProfilePayload(current, fresh));
      setLoadedTabs((current) => new Set(current).add(tab));
      writeCache(userId, tab, fresh);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load profile data.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (initialReady) writeCache(userId, initialTab, initialData);
  }, [initialData, initialReady, initialTab, userId]);

  useEffect(() => {
    if (!loadedTabs.has(activeTab)) void loadTab(activeTab);
    return () => requestRef.current?.abort();
  }, []);

  async function selectTab(tab: ProfileTab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/profile?tab=${tab}`);
    if (loadedTabs.has(tab)) return;
    await loadTab(tab);
  }

  const activeTabLoaded = loadedTabs.has(activeTab);
  const title = useMemo(() => data.user.name || data.user.username || sessionName || data.user.email || "My profile", [data, sessionName]);

  return (
    <div className="list">
      <section className="band profile-shell">
        <span className="tag tag--filled">Profile</span>
        <div className="profile-head">
          {data.user.image ? <img className="profile-avatar" src={data.user.image} alt="" /> : <div className="profile-avatar" aria-hidden="true" />}
          <div className="profile-head__body">
            <h1>{title}</h1>
            {data.user.bio ? <p>{data.user.bio}</p> : <p className="meta">Add a short description to introduce your Beyblade career.</p>}
          </div>
        </div>
      </section>
      <nav className="dashboard-tabs profile-tabs" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? "button dashboard-tab dashboard-tab--active" : "button secondary dashboard-tab"} type="button" onClick={() => selectTab(tab.id)} key={tab.id}>
            {tab.label}
          </button>
        ))}
      </nav>
      {error ? <p className="danger">{error}</p> : null}
      {loading && activeTabLoaded ? <p className="meta">Loading...</p> : null}
      {activeTab === "overview" ? (
        activeTabLoaded ? (
          <section className="tabs">
            <div className="card"><ProfileEditForm name={data.user.name} image={data.user.image} bio={data.user.bio} /></div>
            <div className="list">
              <div className="card profile-snapshot">
                <h2>Snapshot</h2>
                <p>{data.stats.comboCount} posted combo{data.stats.comboCount === 1 ? "" : "s"} - {data.stats.putCount} lineup put{data.stats.putCount === 1 ? "" : "s"}</p>
                <p>{data.stats.careerCount} tournament record{data.stats.careerCount === 1 ? "" : "s"} logged.</p>
              </div>
              <div className="card">
                <h2>Account data</h2>
                <p className="danger">Inactive accounts may be deleted after 90 days. Export your data if you want a backup.</p>
                <a className="button secondary" href="/api/profile/export" download>Export my data</a>
              </div>
            </div>
          </section>
        ) : <LoadingRows />
      ) : null}
      {activeTab === "posts" ? activeTabLoaded ? <section className="list"><h2>My posts / combos</h2><ComboList combos={data.myCombos || []} userId={userId} empty="You have not created any combos yet." /></section> : <LoadingRows /> : null}
      {activeTab === "starred" ? activeTabLoaded ? <section className="list"><h2>Combos I starred</h2><ComboList combos={data.starredCombos || []} userId={userId} empty="You have not starred any combos yet." /></section> : <LoadingRows /> : null}
      {activeTab === "lineup" ? activeTabLoaded ? <section className="list"><h2>Combos in my lineup</h2><ComboList combos={data.putCombos || []} userId={userId} empty="Use Put combo on a public combo to add it here." /></section> : <LoadingRows /> : null}
      {activeTab === "career" ? (
        activeTabLoaded ? (
          <section className="tabs">
            <div className="card"><CareerEntryForm /></div>
            <div className="list">
              <h2>Career</h2>
              {data.careerEntries?.length ? data.careerEntries.map((entry) => (
                <div className="card career-row" key={entry.id}>
                  <div>
                    <span className="tag">{new Date(entry.playedAt).toLocaleDateString()}</span>
                    <h3>{entry.tournamentName}</h3>
                    <p className="meta">{entry.wins}-{entry.losses}{entry.draws ? `-${entry.draws}` : ""}{entry.placement ? ` - ${entry.placement}` : ""}</p>
                    {entry.notes ? <p>{entry.notes}</p> : null}
                  </div>
                  <CareerDeleteButton id={entry.id} />
                </div>
              )) : <p className="meta">No tournament records yet.</p>}
            </div>
          </section>
        ) : <LoadingRows />
      ) : null}
    </div>
  );
}

