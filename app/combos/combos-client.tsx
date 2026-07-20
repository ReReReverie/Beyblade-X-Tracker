"use client";

import Link from "next/link";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, pct } from "@/lib/format-client";
import type { PublicCombo, PublicDeck, PublicFeature } from "@/lib/public-data";

type OverviewResponse = {
  combos: PublicCombo[];
  decks: PublicDeck[];
  features: PublicFeature[];
};

function comboWeightValue(combo: PublicCombo) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: PublicCombo) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

export function CombosClient({ initialData }: { initialData: OverviewResponse }) {
  const combos = initialData.combos;
  const decks = initialData.decks;
  const features = initialData.features;

  return (
    <div className="list">
      <h1>Public combos</h1>
      {features.length ? (
        <section className="featured-combos">
          <h2>Featured combos</h2>
          <div className="featured-grid">
            {features.map((feature) => {
              const combo = feature.combo;
              const wins = combo.winsCount;
              const total = combo.battlesACount + combo.battlesBCount;
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
        </section>
      ) : null}
      {decks.length ? (
        <section>
          <h2>Public decks</h2>
          <div className="grid">
            {decks.map((deck) => {
              const wins = deck.winsCount;
              const total = deck.battlesACount + deck.battlesBCount;
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
        </section>
      ) : null}
      <h2>Public 1v1 combos</h2>
      {combos.length ? (
        <div className="grid public-combo-grid">
          {combos.map((combo) => {
            const wins = combo.winsCount;
            const total = combo.battlesACount + combo.battlesBCount;
            const comboWeight = comboWeightValue(combo);
            const condition = comboConditionValue(combo);
            const record = `${wins}-${total - wins}`;
            return (
              <article className="card public-combo-card" key={combo.id}>
                <Link className="public-combo-card__main" href={`/combos/${combo.id}`}>
                  {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                  <h2>{combo.name}</h2>
                </Link>
                <p className="meta public-combo-card__creator">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                <div className="public-combo-card__stats" aria-label="Combo stats">
                  <span>
                    <strong>{comboWeight !== null ? `${comboWeight.toFixed(2)}g` : "N/A"}</strong>
                    Weight
                  </span>
                  <span>
                    <strong>{condition}/10</strong>
                    Condition
                  </span>
                  <span>
                    <strong>{record}</strong>
                    {pct(wins, total)}
                  </span>
                </div>
                <p className="meta public-combo-card__parts">
                  {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
                </p>
                <div className="public-combo-card__actions">
                  <StarButton comboId={combo.id} initialCount={combo.starsCount} initiallyStarred={combo.initiallyStarred} />
                  <PutComboButton comboId={combo.id} initialCount={combo.putsCount} initiallyPut={combo.initiallyPut} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="meta">No public combos yet. Import parts from the catalog in Create, build a combo, set visibility to Public, and it will appear here.</p>
      )}
    </div>
  );
}

