"use client";

import { ComboComments } from "@/components/combo-comments";
import { ComboDetailTabs } from "@/components/combo-detail-tabs";
import { ComboVisibilityForm } from "@/components/combo-visibility-form";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, pct } from "@/lib/format";

type ComboDetailResponse = {
  combo: {
    id: string;
    name: string;
    ownerId: string;
    visibility: "PUBLIC" | "PRIVATE";
    owner: { name: string | null; username: string | null } | null;
    parts: Array<{
      role: "BLADE" | "RATCHET" | "BIT" | "LOCK_CHIP" | "MAIN_BLADE" | "ASSIST_BLADE" | "OVER_BLADE" | "METAL_BLADE";
      part: {
        id: string;
        name: string;
        manufacturer: "HASBRO" | "TAKARA_TOMY" | "FAKE" | "UNKNOWN";
        weightGrams: number | null;
        conditionRating: number;
        notes: string | null;
        photos: Array<{ url: string }>;
      };
    }>;
    comments: Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { name: string | null; username: string | null };
    }>;
    starsCount: number;
    putsCount: number;
    winsCount: number;
    battlesACount: number;
    battlesBCount: number;
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

function formatPartRole(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
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

export function ComboDetailClient({ data }: { data: ComboDetailResponse }) {
  const combo = data.combo;
  const wins = combo.winsCount;
  const total = combo.battlesACount + combo.battlesBCount;
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
          <ComboDetailTabs comboId={combo.id} battles={data.battleHistory} />
          <StarButton comboId={combo.id} initialCount={combo.starsCount} initiallyStarred={data.initiallyStarred} />
          <PutComboButton comboId={combo.id} initialCount={combo.putsCount} initiallyPut={data.initiallyPut} />
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
              <span className="tag">{formatPartRole(role)}</span>
              <h3>{part.name}</h3>
              <p className="meta">
                {formatManufacturer(part.manufacturer)} - {part.weightGrams !== null ? part.weightGrams.toFixed(2) : "N/A"} g - Condition {part.conditionRating}/10
              </p>
              {part.notes ? <p>{part.notes}</p> : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
