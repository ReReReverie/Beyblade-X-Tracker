"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hideLoadingOverlay } from "@/components/loading-overlay-events";
import { ApiError, apiRequest } from "@/lib/api-client";
import { ChallongeResultsDisplay } from "@/components/challonge/ChallongeResultsDisplay";
import { ErrorBoundary as ChallongeErrorBoundary } from "@/components/challonge/ErrorBoundary";
import { CareerDeleteButton, CareerEntryForm, ProfileEditForm } from "@/components/profile-forms";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, formatStableDate, formatVisibility, normalizeImageUrl, pct } from "@/lib/format-client";
import { comboCondition, comboWeight } from "@/lib/stats-client";

type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

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

const profileTabIds = tabs.map((tab) => tab.id);

function isProfileTab(value: string | null | undefined): value is ProfileTab {
  return typeof value === "string" && profileTabIds.includes(value as ProfileTab);
}

function parseProfileTab(value: string | null | undefined): ProfileTab {
  return isProfileTab(value) ? value : "overview";
}

function relativeUrl(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function isAbortError(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && (error as { name?: unknown }).name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfileTabPayload(value: unknown): value is ProfileTabPayload {
  if (!isRecord(value)) return false;

  for (const key of ["myCombos", "starredCombos", "putCombos", "careerEntries"]) {
    if (value[key] !== undefined && !Array.isArray(value[key])) return false;
  }
  if (value.user !== undefined && !isRecord(value.user)) return false;
  if (value.stats !== undefined && !isRecord(value.stats)) return false;
  return true;
}

const cacheVersion = "v5";
const ttlMs = 5 * 60 * 1000;

function isCacheableTab(tab: ProfileTab) {
  return tab !== "career";
}

function cacheKey(userId: string, tab: ProfileTab) {
  return `profile-cache:${cacheVersion}:${userId}:${tab}`;
}

function readCache(userId: string, tab: ProfileTab): ProfileTabPayload | null {
  if (!isCacheableTab(tab)) return null;

  try {
    const raw = sessionStorage.getItem(cacheKey(userId, tab));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.savedAt !== "number" || !isProfileTabPayload(parsed.data)) return null;
    if (Date.now() - parsed.savedAt > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(userId: string, tab: ProfileTab, data: ProfileTabPayload) {
  if (!isCacheableTab(tab)) return;

  try {
    sessionStorage.setItem(cacheKey(userId, tab), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {}
}

function mergeProfilePayload(current: ProfilePayload, incoming: ProfileTabPayload, includeCareerEntries = true): ProfilePayload {
  return {
    ...current,
    user: incoming.user ? { ...current.user, ...incoming.user } : current.user,
    stats: incoming.stats || current.stats,
    myCombos: incoming.myCombos ?? current.myCombos,
    starredCombos: incoming.starredCombos ?? current.starredCombos,
    putCombos: incoming.putCombos ?? current.putCombos,
    careerEntries: includeCareerEntries ? incoming.careerEntries ?? current.careerEntries : current.careerEntries
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
            {combo.photos?.[0] ? <img className="photo" src={normalizeImageUrl(combo.photos[0].url) || combo.photos[0].url} alt="" /> : null}
            <Link href={`/combos/${combo.id}`} prefetch={false}><h3>{combo.name}</h3></Link>
            <p className="meta">Creator: {combo.owner?.name || combo.owner?.username || "Unknown"}</p>
            <p className="meta">
              {comboWeightValue !== null ? `${comboWeightValue.toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
            </p>
            <p className="meta">
              {combo.parts.map((entry: any) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
            </p>
            {StarButton ? <StarButton comboId={combo.id} initialCount={combo._count?.stars ?? combo.stars?.length ?? 0} initiallyStarred={combo.stars?.some((star: any) => star.userId === userId)} /> : null}
            {PutComboButton ? <PutComboButton comboId={combo.id} initialCount={combo._count?.puts ?? combo.puts?.length ?? 0} initiallyPut={combo.puts?.some((put: any) => put.userId === userId) || Boolean(combo.puts?.length)} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`skeleton skeleton--line ${className}`} />;
}

function ComboCardSkeleton() {
  return (
    <div className="card skeleton-card profile-combo-skeleton" aria-hidden="true">
      <div className="skeleton skeleton--photo" />
      <SkeletonLine className="skeleton--title" />
      <SkeletonLine />
      <SkeletonLine className="skeleton--wide" />
      <div className="profile-skeleton-actions">
        <div className="skeleton skeleton--button" />
        <div className="skeleton skeleton--button" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="card skeleton-card profile-form-skeleton" aria-hidden="true">
      <SkeletonLine className="skeleton--title" />
      <SkeletonLine />
      <SkeletonLine />
      <div className="skeleton skeleton--textarea" />
      <div className="skeleton skeleton--button" />
    </div>
  );
}

function LoadingRows({ tab }: { tab: ProfileTab }) {
  if (tab === "posts" || tab === "starred" || tab === "lineup") {
    return (
      <section className="list profile-tab-loading" aria-live="polite" aria-label="Loading profile data">
        <SkeletonLine className="skeleton--heading" />
        <div className="grid">
          <ComboCardSkeleton />
          <ComboCardSkeleton />
          <ComboCardSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="tabs profile-tab-loading" aria-live="polite" aria-label="Loading profile data">
      <FormSkeleton />
      <div className="list">
        <div className="card skeleton-card" aria-hidden="true">
          <SkeletonLine className="skeleton--title" />
          <SkeletonLine />
          <SkeletonLine className="skeleton--wide" />
        </div>
        {tab === "career" ? (
          <div className="card skeleton-card" aria-hidden="true">
            <SkeletonLine className="skeleton--short" />
            <SkeletonLine className="skeleton--title" />
            <SkeletonLine />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TabError({ tab, message, onRetry }: { tab: ProfileTab; message: string; onRetry: () => void }) {
  const label = tabs.find((candidate) => candidate.id === tab)?.label || "section";

  return (
    <section className="band" role="alert" aria-live="assertive">
      <span className="tag tag--filled">{label} unavailable</span>
      <h2>We could not load this section.</h2>
      <p className="danger">{message}</p>
      <button type="button" onClick={onRetry}>Try again</button>
    </section>
  );
}

type PendingProfileRequest = {
  controller: AbortController;
  tab: ProfileTab;
  token: number;
};

export default function ProfileClient({
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
  const initialLoadedTabs = new Set<ProfileTab>(initialReady ? [initialTab] : []);
  const loadedTabsRef = useRef<Set<ProfileTab>>(initialLoadedTabs);
  const [loadedTabs, setLoadedTabs] = useState<Set<ProfileTab>>(() => new Set(initialLoadedTabs));
  const [tabError, setTabError] = useState<{ tab: ProfileTab; message: string } | null>(null);
  const requestRef = useRef<PendingProfileRequest | null>(null);
  const requestTokenRef = useRef(0);
  const initialTabRef = useRef(initialTab);
  const userId = initialData.user.id;

  const markTabLoaded = useCallback((tab: ProfileTab) => {
    const next = new Set(loadedTabsRef.current);
    next.add(tab);
    loadedTabsRef.current = next;
    setLoadedTabs(next);
  }, []);

  const cancelPendingRequest = useCallback((tab?: ProfileTab) => {
    const pending = requestRef.current;
    if (!pending || (tab && pending.tab !== tab)) return;

    requestTokenRef.current += 1;
    pending.controller.abort();
    requestRef.current = null;
  }, []);

  const loadTab = useCallback(async (tab: ProfileTab) => {
    cancelPendingRequest();
    const token = ++requestTokenRef.current;
    const controller = new AbortController();
    requestRef.current = { controller, tab, token };
    setTabError(null);

    const isCurrentRequest = () => requestRef.current?.token === token && requestTokenRef.current === token && !controller.signal.aborted;

    try {
      const cached = readCache(userId, tab);
      if (!isCurrentRequest()) return;
      if (cached) {
        setData((current) => mergeProfilePayload(current, cached, false));
        markTabLoaded(tab);
        return;
      }

      const fresh = await apiRequest<unknown>(`/api/profile?tab=${encodeURIComponent(tab)}&partial=1`, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!isCurrentRequest() || !isProfileTabPayload(fresh)) {
        if (isCurrentRequest()) throw new Error("Could not load profile data.");
        return;
      }
      setData((current) => mergeProfilePayload(current, fresh));
      markTabLoaded(tab);
      writeCache(userId, tab, fresh);
    } catch (err) {
      if (!isCurrentRequest() || isAbortError(err)) return;
      if (err instanceof ApiError && err.status === 429) {
        setTabError({ tab, message: "Too many tab requests. Please wait a moment and try again." });
      } else {
        setTabError({ tab, message: err instanceof Error ? err.message : "Could not load profile data." });
      }
    } finally {
      if (requestRef.current?.token === token) {
        requestRef.current = null;
      }
    }
  }, [cancelPendingRequest, markTabLoaded, userId]);

  useEffect(() => {
    if (initialReady && isCacheableTab(initialTab)) writeCache(userId, initialTab, initialData);
  }, [initialData, initialReady, initialTab, userId]);

  useEffect(() => {
    if (initialTabRef.current === initialTab) return;

    initialTabRef.current = initialTab;
    cancelPendingRequest();
    const nextLoadedTabs = new Set<ProfileTab>(initialReady ? [initialTab] : []);
    loadedTabsRef.current = nextLoadedTabs;
    setLoadedTabs(nextLoadedTabs);
    setData(initialData);
    setActiveTab(initialTab);
    setTabError(null);
  }, [cancelPendingRequest, initialData, initialReady, initialTab]);

  useEffect(() => {
    function syncTabFromUrl() {
      const url = new URL(window.location.href);
      const requested = url.searchParams.get("tab");
      const nextTab = parseProfileTab(requested);
      if (requested !== nextTab) {
        url.searchParams.set("tab", nextTab);
        window.history.replaceState(window.history.state, "", relativeUrl(url));
      }

      cancelPendingRequest();
      setTabError(null);
      setActiveTab(nextTab);
    }

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      cancelPendingRequest();
    };
  }, [cancelPendingRequest]);

  useEffect(() => {
    if (loadedTabsRef.current.has(activeTab)) {
      if (requestRef.current?.tab !== activeTab) cancelPendingRequest();
      return;
    }
    if (requestRef.current?.tab === activeTab) return;

    void loadTab(activeTab);
    return () => cancelPendingRequest(activeTab);
  }, [activeTab, cancelPendingRequest, loadTab]);

  function selectTab(tab: ProfileTab) {
    hideLoadingOverlay();
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("tab");
    if (tab === activeTab && requested === tab) return;

    cancelPendingRequest();
    setActiveTab(tab);
    url.searchParams.set("tab", tab);
    const nextUrl = relativeUrl(url);
    if (tab === activeTab) {
      window.history.replaceState(window.history.state, "", nextUrl);
    } else {
      window.history.pushState(window.history.state, "", nextUrl);
    }
  }

  const activeTabLoaded = loadedTabs.has(activeTab);
  const activeTabError = tabError?.tab === activeTab ? tabError.message : null;
  const retryActiveTab = useCallback(() => {
    void loadTab(activeTab);
  }, [activeTab, loadTab]);
  const title = useMemo(() => data.user.name || data.user.username || sessionName || data.user.email || "My profile", [data, sessionName]);

  return (
    <div className="list">
      <section className="band profile-shell">
        <span className="tag tag--filled">Profile</span>
        <div className="profile-head">
          {data.user.image ? <img className="profile-avatar" src={normalizeImageUrl(data.user.image) || data.user.image} alt="" /> : <div className="profile-avatar" aria-hidden="true" />}
          <div className="profile-head__body">
            <h1>{title}</h1>
            {data.user.bio ? <p>{data.user.bio}</p> : <p className="meta">Add a short description to introduce your Beyblade career.</p>}
          </div>
        </div>
      </section>
      <nav className="dashboard-tabs profile-tabs" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? "button dashboard-tab dashboard-tab--active" : "button secondary dashboard-tab"} type="button" onClick={() => selectTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} key={tab.id}>
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "overview" ? (
        activeTabLoaded ? (
          <section className="tabs profile-tab-panel">
            <div className="card profile-form-card">{ProfileEditForm ? <ProfileEditForm name={data.user.name} image={data.user.image} bio={data.user.bio} /> : null}</div>
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
        ) : activeTabError ? <TabError tab={activeTab} message={activeTabError} onRetry={retryActiveTab} /> : <LoadingRows tab={activeTab} />
      ) : null}
      {activeTab === "posts" ? activeTabLoaded ? <section className="list"><h2>My posts / combos</h2><ComboList combos={data.myCombos || []} userId={userId} empty="You have not created any combos yet." /></section> : activeTabError ? <TabError tab={activeTab} message={activeTabError} onRetry={retryActiveTab} /> : <LoadingRows tab={activeTab} /> : null}
      {activeTab === "starred" ? activeTabLoaded ? <section className="list"><h2>Combos I starred</h2><ComboList combos={data.starredCombos || []} userId={userId} empty="You have not starred any combos yet." /></section> : activeTabError ? <TabError tab={activeTab} message={activeTabError} onRetry={retryActiveTab} /> : <LoadingRows tab={activeTab} /> : null}
      {activeTab === "lineup" ? activeTabLoaded ? <section className="list"><h2>Combos in my lineup</h2><ComboList combos={data.putCombos || []} userId={userId} empty="Use Put combo on a combo to add it here." /></section> : activeTabError ? <TabError tab={activeTab} message={activeTabError} onRetry={retryActiveTab} /> : <LoadingRows tab={activeTab} /> : null}
      {activeTab === "career" ? (
        activeTabLoaded ? (
          <section className="tabs profile-tab-panel">
            <div className="card profile-form-card">{CareerEntryForm ? <CareerEntryForm /> : null}</div>
            <div className="list">
              <h2>Career</h2>
              {data.careerEntries?.length ? data.careerEntries.map((entry) => (
                <div className="card career-row" key={entry.id}>
                  <div>
                    <span className="tag">{formatStableDate(entry.playedAt)}</span>
                    <h3>{entry.tournamentName}</h3>
                    {entry.challongeUrl ? (
                      <>
                        <ChallongeErrorBoundary>
                          <ChallongeResultsDisplay
                            snapshot={entry.challongeSnapshot}
                            trackedParticipantName={entry.trackedParticipantName}
                            challongeUrl={entry.challongeUrl}
                            placement={entry.placement}
                            wins={entry.wins}
                            losses={entry.losses}
                          />
                        </ChallongeErrorBoundary>
                        {entry.challongeSyncError ? (
                          <p className="danger">{entry.challongeSyncError}</p>
                        ) : null}
                      </>
                    ) : (
                      <div className="challonge-results">
                        <div className="career-result">
                          <span className="meta">Record</span>
                          <strong>{entry.wins}W - {entry.losses}L{entry.draws ? ` - ${entry.draws}D` : ""}</strong>
                        </div>
                        {entry.placement ? (
                          <div className="career-result">
                            <span className="meta">Final Standing</span>
                            <strong>{entry.placement}</strong>
                          </div>
                        ) : null}
                      </div>
                    )}
                    {entry.notes ? <p>{entry.notes}</p> : null}
                  </div>
                  {CareerDeleteButton ? <CareerDeleteButton id={entry.id} /> : null}
                </div>
              )) : <p className="meta">No tournament records yet.</p>}
            </div>
          </section>
        ) : activeTabError ? <TabError tab={activeTab} message={activeTabError} onRetry={retryActiveTab} /> : <LoadingRows tab={activeTab} />
      ) : null}
    </div>
  );
}







