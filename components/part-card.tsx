"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartType, Manufacturer, Visibility } from "@prisma/client";
import { formatPartType, formatManufacturer, formatVisibility } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";

type PartWithPhotos = {
  id: string;
  name: string;
  type: PartType;
  manufacturer: Manufacturer;
  weightGrams: string | number;
  conditionRating: string | number;
  visibility: Visibility;
  notes: string | null;
  photos: { id: string; url: string }[];
};

export function PartCard({ part }: { part: PartWithPhotos }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/parts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: part.id,
          name: data.name,
          type: data.type,
          manufacturer: data.manufacturer,
          weightGrams: Number(data.weightGrams),
          conditionRating: Number(data.conditionRating),
          visibility: data.visibility,
          notes: data.notes || null,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to update part.");

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update part.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="card">
        <form onSubmit={handleSave} style={{ display: "grid", gap: "0.8rem" }}>
          <h3>Edit Part</h3>
          <label>
            Name
            <input name="name" defaultValue={part.name} required />
          </label>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <label>
              Type
              <select name="type" defaultValue={part.type}>
                <option value="BLADE">Blade</option>
                <option value="RATCHET">Ratchet</option>
                <option value="BIT">Bit</option>
              </select>
            </label>
            <label>
              Manufacturer
              <select name="manufacturer" defaultValue={part.manufacturer}>
                <option value="UNKNOWN">Unknown</option>
                <option value="HASBRO">Hasbro</option>
                <option value="TAKARA_TOMY">Takara Tomy</option>
                <option value="FAKE">Fake</option>
              </select>
            </label>
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <label>
              Weight grams
              <input
                name="weightGrams"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={Number(part.weightGrams)}
                required
              />
            </label>
            <label>
              Condition / 10
              <input
                name="conditionRating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                defaultValue={Number(part.conditionRating)}
                required
              />
            </label>
          </div>
          <label>
            Visibility
            <select name="visibility" defaultValue={part.visibility}>
              <option value="PUBLIC">Public: others can build combos with this</option>
              <option value="PRIVATE">Private: only you can build combos with this</option>
            </select>
          </label>
          <label>
            Notes
            <textarea name="notes" defaultValue={part.notes || ""} />
          </label>
          {error ? <p className="danger">{error}</p> : null}
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card part-row" style={{ paddingBottom: "4.1rem", position: "relative" }}>
      <div>
        <strong>{part.name}</strong>
        <p className="meta">
          {formatPartType(part.type)} - {formatManufacturer(part.manufacturer)} - {part.weightGrams ? `${Number(part.weightGrams).toFixed(2)} g` : "Weight optional"} - {Number(part.conditionRating)}/10 - {formatVisibility(part.visibility)}
        </p>
        {part.notes ? <p className="meta" style={{ marginTop: "0.4rem", fontStyle: "italic" }}>{part.notes}</p> : null}
      </div>
      <span className="pill">{part.photos.length} photo</span>
      <div style={{ position: "absolute", bottom: "0.8rem", right: "7rem" }}>
        <button
          className="button button-small"
          type="button"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
      </div>
      <DeleteButton endpoint="parts" id={part.id} label="Delete part" />
    </div>
  );
}
