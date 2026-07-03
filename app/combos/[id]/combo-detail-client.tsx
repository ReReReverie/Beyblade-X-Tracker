"use client";

import { useEffect, useState } from "react";
import { ComboComments } from "@/components/combo-comments";
import { ComboDetailTabs } from "@/components/combo-detail-tabs";
import { ComboVisibilityForm } from "@/components/combo-visibility-form";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, formatPartType, pct } from "@/lib/format";

type ComboDetailResponse = {
  combo: {
    id: string;
    name: string;
    ownerId: string;
    visibility: "PUBLIC" | "PRIVATE";
    owner: { name: string | null; username: string | null } | null;
    parts: Array<{
      role: "BLADE" | "RATCHET" | "BIT";
      part: {
        id: string;
        name: string;
        manufacturer: "HASBRO" | "TAKARA_TOMY" | "FAKE" | "UNKNOWN";
        weightGrams: string | number | null;
        conditionRating: string | number;
        notes: string | null;
        photos: Array<{ url: string }>;
      };
    }>;
    stars: Array<{ userId: string }>;
    puts: Array<{ userId: string }>;
    comments: Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { name: string | null; username: string | null };
    }>;
    wins: Array<{ id: string }>;
    battlesA: Array<{ id: string }>;
    battlesB: Array<{ id: string }>;
  };
  battleHistory: Array<{
    id: string;
    comboAId: string | null;
    comboBId: string | null;
    winnerId: string | null;
    playedAt: string;
    comboA: { name: string } | null;
    comboB: { name: string } | null;
    winner: { name: string } | null;
    comboARpm: number | null;
    comboBRpm: number | null;
  }>;
  signedIn: boolean;
  isOwner: boolean;
  initiallyStarred: boolean;
  initiallyPut: boolean;
};

function toBattlePoints(battles: ComboDetailResponse["battleHistory"]) {
  return battles.map((battle) => ({
    ...battle,
    playedAt: new Date(battle.playedAt)
  }));
}

function comboWeightValue(combo: ComboDetailResponse["combo"]) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: ComboDetailResponse["combo"]) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

function DetailSkeleton() {
  return (
    <div className="combo-detail">
      <section className="combo-detail__left">
        <div className="band" aria-hidden="true">
          <div className="skeleton skeleton--line skeleton--title" style={{ width: "9rem" }} />
          <div className="skeleton skeleton--line skeleton--title" style={{ width: "70%", marginTop: "1rem" }} />
          <div className="skeleton skeleton--line" style={{ width: "55%", marginTop: "1rem" }} />
          <div className="skeleton skeleton--line" style={{ width: "85%", marginTop: "1rem" }} />
          <div className="skeleton skeleton--button" style={{ marginTop: "1.2rem" }} />
        </div>
      </section>
      <section className="combo-detail__right list" aria-hidden="true">
        <div className="card skeleton-card">
          <div className="skeleton skeleton--line skeleton--title" />
          <div className="skeleton skeleton--chart" />
        </div>
        <div className="card skeleton-card">
          <div className="skeleton skeleton--line skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line" />
        </div>
        <div className="card skeleton-card">
          <div className="skeleton skeleton--line skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line" />
        </div>
      </section>
    </div>
  );
}

export function ComboDetailClient({ comboId }: { comboId: string }) {
  const [data, setData] = useState<ComboDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCombo() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/combos/${comboId}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error("Failed to load combo details.");
        }
        const payload = (await response.json()) as ComboDetailResponse;
        setData(payload);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError("Unable to load this combo right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCombo();

    return () => controller.abort();
  }, [comboId]);

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="list">
        <p className="meta danger" role="alert">
          {error || "Combo not found."}
        </p>
      </div>
    );
  }

  const combo = data.combo;
  const wins = combo.wins.length;
  const total = combo.battlesA.length + combo.battlesB.length;
  const battleHistory = toBattlePoints(data.battleHistory);
  const comboWeight = comboWeightValue(combo);

  return (
    <div className="combo-detail">
      <section className="combo-detail__left">
        <div className="band">
          <span className="tag tag--filled">Combo report</span>
          <h1>{combo.name}</h1>
          <p className="meta">Creator: {combo.owner?.name || combo.owner?.username || "Unknown"}</p>
          <p>
            {comboWeight !== null ? `${comboWeight.toFixed(2)} g total` : "Weight unavailable"} - Condition {comboConditionValue(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
          </p>
          {data.isOwner ? <ComboVisibilityForm comboId={combo.id} initialVisibility={combo.visibility} /> : null}
          <ComboDetailTabs comboId={combo.id} battles={battleHistory} />
          <StarButton comboId={combo.id} initialCount={combo.stars.length} initiallyStarred={data.initiallyStarred} />
          <PutComboButton comboId={combo.id} initialCount={combo.puts.length} initiallyPut={data.initiallyPut} />
          <ComboComments comboId={combo.id} comments={combo.comments} signedIn={data.signedIn} />
        </div>
      </section>
      <section className="combo-detail__right list">
        <h2>Parts</h2>
        {combo.parts.map(({ part, role }) => (
          <div className="card part-card" key={part.id}>
            {part.photos[0] ? (
              <img className="photo" src={part.photos[0].url.replace("http://", "https://")} alt={part.name} />
            ) : (
              <div className="photo" aria-hidden="true" />
            )}
            <div>
              <span className="tag">{formatPartType(role)}</span>
              <h3>{part.name}</h3>
              <p className="meta">
                {formatManufacturer(part.manufacturer)} - {Number(part.weightGrams).toFixed(2)} g - Condition {Number(part.conditionRating)}/10
              </p>
              {part.notes ? <p>{part.notes}</p> : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}