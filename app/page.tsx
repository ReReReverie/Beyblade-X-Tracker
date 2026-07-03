"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WRGraph } from "@/components/wr-graph";
import { StarButton } from "@/components/star-button";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, pct } from "@/lib/format";

type HomeCombo = {
  id: string;
  name: string;
  owner: { name: string | null; username: string | null };
  stars: Array<{ userId: string }>;
  initiallyStarred: boolean;
  wins: Array<{ id: string }>;
  battlesA: Array<{ id: string }>;
  battlesB: Array<{ id: string }>;
  parts: Array<{ part: { id: string; name: string; manufacturer: "HASBRO" | "TAKARA_TOMY" | "FAKE" | "UNKNOWN"; weightGrams: string | number | null; conditionRating: string | number } }>;
};

type HomeBattle = {
  id: string;
  comboAId: string | null;
  comboBId: string | null;
  winnerId: string | null;
  playedAt: string;
};

type HomeResponse = {
  combos: HomeCombo[];
  battleHistory: HomeBattle[];
};

function toBattlePoints(battles: HomeBattle[]) {
  return battles.map((battle) => ({
    ...battle,
    playedAt: new Date(battle.playedAt)
  }));
}

function comboWeightValue(combo: HomeCombo) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: HomeCombo) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--line skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--chart" />
      <div className="skeleton skeleton--button" />
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHome() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/home", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to load home data.");
        }
        const payload = (await response.json()) as HomeResponse;
        setData(payload);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError("Unable to load recent builds right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadHome();

    return () => controller.abort();
  }, []);

  const combos = data?.combos ?? [];
  const battleHistory = data ? toBattlePoints(data.battleHistory) : [];

  return (
    <div className="list">
      <section className="hero">
        <div>
          <h1>Track what actually wins, not only what is meta.</h1>
          <p>
            Log Beyblade X parts by source, weight, wear rating, and photos. Build combos, record
            simple win-loss results, and compare off-meta experiments against real testing data.
          </p>
          <div className="navlinks">
            <Link className="button" href="/auth/signup">Create account</Link>
            <Link className="button secondary" href="/combos">Browse combos</Link>
          </div>
        </div>
      </section>
      <section>
        <h2>Recent public builds</h2>
        {loading ? (
          <div className="grid">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <p className="meta danger" role="alert">
            {error}
          </p>
        ) : combos.length ? (
          <div className="grid">
            {combos.map((combo) => {
              const wins = combo.wins.length;
              const total = combo.battlesA.length + combo.battlesB.length;
              const weight = comboWeightValue(combo);
              const condition = comboConditionValue(combo);
              return (
                <Link className="card" key={combo.id} href={`/combos/${combo.id}`}>
                  <h3>{combo.name}</h3>
                  <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                  <p className="meta">
                    {weight !== null ? `${weight.toFixed(2)} g` : "Weight unavailable"} - Condition {condition}/10 - {wins}-{total - wins} ({pct(wins, total)})
                  </p>
                  <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battleHistory)} />
                  <p className="meta">
                    {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
                  </p>
                  <StarButton
                    comboId={combo.id}
                    initialCount={combo.stars.length}
                    initiallyStarred={combo.initiallyStarred}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="meta">No public combos yet. Be the first to post one from your dashboard.</p>
        )}
      </section>
    </div>
  );
}
