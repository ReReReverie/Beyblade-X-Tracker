"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { WRGraph } from "@/components/wr-graph";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, pct } from "@/lib/format";

type ComboItem = {
  id: string;
  name: string;
  owner: { name: string | null; username: string | null };
  stars: Array<{ userId: string }>;
  puts: Array<{ userId: string }>;
  photos: Array<{ url: string }>;
  initiallyStarred: boolean;
  initiallyPut: boolean;
  wins: Array<{ id: string }>;
  battlesA: Array<{ id: string }>;
  battlesB: Array<{ id: string }>;
  parts: Array<{
    part: {
      id: string;
      name: string;
      manufacturer: "HASBRO" | "TAKARA_TOMY" | "FAKE" | "UNKNOWN";
      weightGrams: string | number | null;
      conditionRating: string | number;
    };
  }>;
};

type BattleRow = {
  id: string;
  comboAId: string | null;
  comboBId: string | null;
  winnerId: string | null;
  playedAt: string;
};

type OverviewResponse = {
  combos: ComboItem[];
  decks: Array<{
    id: string;
    name: string;
    owner: { name: string | null; username: string | null };
    slots: Array<{ combo: { id: string; name: string } }>;
    wins: Array<{ id: string }>;
    battlesA: Array<{ id: string }>;
    battlesB: Array<{ id: string }>;
  }>;
  features: Array<{
    id: string;
    slot: "DAY" | "WEEK" | "MONTH" | "SPONSOR";
    title: string;
    sponsorName: string | null;
    posterUrl: string | null;
    combo: ComboItem;
  }>;
  battleHistory: BattleRow[];
};

function toBattlePoints(battles: BattleRow[]) {
  return battles.map((battle) => ({
    ...battle,
    playedAt: new Date(battle.playedAt)
  }));
}

function comboWeightValue(combo: ComboItem) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: ComboItem) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

function ComboSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={featured ? "card featured-card skeleton-card" : "card skeleton-card"} aria-hidden="true">
      <div className="skeleton skeleton--line skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--chart" />
      <div className="skeleton skeleton--button" />
    </div>
  );
}

function DeckSkeleton() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--line skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line" />
    </div>
  );
}

export function CombosClient() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCombos() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/combos/overview", {
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error("Failed to load combo overview.");
        }
        const payload = (await response.json()) as OverviewResponse;
        setData(payload);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError("Unable to load public combos right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCombos();

    return () => controller.abort();
  }, []);

  const combos = data?.combos ?? [];
  const decks = data?.decks ?? [];
  const features = data?.features ?? [];
  const battleHistory = data ? toBattlePoints(data.battleHistory) : [];

  return (
    <div className="list">
      <h1>Public combos</h1>
      {loading || features.length ? (
        <section className="featured-combos">
          <h2>Featured combos</h2>
          {loading && !features.length ? (
            <div className="featured-grid">
              {Array.from({ length: 3 }, (_, index) => (
                <ComboSkeleton featured key={index} />
              ))}
            </div>
          ) : features.length ? (
            <div className="featured-grid">
              {features.map((feature) => {
                const combo = feature.combo;
                const wins = combo.wins.length;
                const total = combo.battlesA.length + combo.battlesB.length;
                return (
                  <Link className="card featured-card" key={feature.id} href={`/combos/${combo.id}`}>
                    <span className="tag tag--filled">{feature.slot === "SPONSOR" ? "Sponsored" : feature.slot.toLowerCase()}</span>
                    {feature.posterUrl || combo.photos[0] ? (
                      <img className="photo featured-card__photo" src={feature.posterUrl || combo.photos[0]?.url} alt="" />
                    ) : null}
                    <h3>{feature.title}</h3>
                    <strong>{combo.name}</strong>
                    <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                    {feature.sponsorName ? <p className="meta">Presented by {feature.sponsorName}</p> : null}
                    <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}
      {loading || decks.length ? (
        <section>
          <h2>Public decks</h2>
          {loading && !decks.length ? (
            <div className="grid">
              {Array.from({ length: 3 }, (_, index) => (
                <DeckSkeleton key={index} />
              ))}
            </div>
          ) : decks.length ? (
            <div className="grid">
              {decks.map((deck) => {
                const wins = deck.wins.length;
                const total = deck.battlesA.length + deck.battlesB.length;
                return (
                  <div className="card" key={deck.id}>
                    <span className="tag tag--filled">3v3 deck</span>
                    <h2>{deck.name}</h2>
                    <p className="meta">Creator: {deck.owner.name || deck.owner.username || "Unknown"}</p>
                    <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                    <p className="meta">{deck.slots.map((slot) => slot.combo.name).join(" / ")}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}
      <h2>Public 1v1 combos</h2>
      {loading && !combos.length ? (
        <div className="grid public-combo-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <ComboSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <p className="meta danger" role="alert">
          {error}
        </p>
      ) : combos.length ? (
        <div className="grid public-combo-grid">
          {combos.map((combo) => {
            const wins = combo.wins.length;
            const total = combo.battlesA.length + combo.battlesB.length;
            const comboWeight = comboWeightValue(combo);
            return (
              <Link className="card public-combo-card" key={combo.id} href={`/combos/${combo.id}`}>
                {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                <h2>{combo.name}</h2>
                <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                <p className="meta">
                  {comboWeight !== null ? `${comboWeight.toFixed(2)} g` : "Weight unavailable"} - Condition {comboConditionValue(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
                </p>
                <p className="meta">
                  {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
                </p>
                <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battleHistory)} />
                <StarButton comboId={combo.id} initialCount={combo.stars.length} initiallyStarred={combo.initiallyStarred} />
                <PutComboButton comboId={combo.id} initialCount={combo.puts.length} initiallyPut={combo.initiallyPut} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="meta">No public combos yet. Import parts from the catalog in your dashboard, build a combo, set visibility to Public, and it will appear here.</p>
      )}
    </div>
  );
}