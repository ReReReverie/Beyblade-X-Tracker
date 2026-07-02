"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CatalogPart = {
  id: string;
  name: string;
  type: "BLADE" | "RATCHET" | "BIT";
  weightGrams: string;
  metaTier: string | null;
};

const typeLabels = {
  BLADE: "Blade",
  RATCHET: "Ratchet",
  BIT: "Bit"
} as const;

export function CatalogImportForm({
  catalogParts,
  ownedCatalogIds
}: {
  catalogParts: CatalogPart[];
  ownedCatalogIds: string[];
}) {
  const router = useRouter();
  const owned = useMemo(() => new Set(ownedCatalogIds), [ownedCatalogIds]);
  const [filter, setFilter] = useState<"ALL" | CatalogPart["type"]>("ALL");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const importable = catalogParts.filter((part) => !owned.has(part.id));
  const visible = importable.filter((part) => filter === "ALL" || part.type === filter);

  async function importParts(catalogIds: string[]) {
    if (!catalogIds.length) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogIds })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Import failed.");
      setSelectedId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="catalog-dropdown">
      <summary>Import from meta catalog ({importable.length} available)</summary>
      <div className="catalog-dropdown__body">
        <p className="meta">Add competitive parts to your garage without typing specs manually.</p>
        <label>
          Filter
          <select value={filter} onChange={(event) => { setFilter(event.target.value as typeof filter); setSelectedId(""); }}>
            <option value="ALL">All types</option>
            <option value="BLADE">Blades</option>
            <option value="RATCHET">Ratchets</option>
            <option value="BIT">Bits</option>
          </select>
        </label>
        <label>
          Part
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Choose a part…</option>
            {visible.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} ({typeLabels[part.type]}, {part.metaTier ?? "?"}-tier, {Number(part.weightGrams).toFixed(2)} g)
              </option>
            ))}
          </select>
        </label>
        <div className="catalog-dropdown__actions">
          <button disabled={busy || !selectedId} onClick={() => importParts([selectedId])} type="button">
            {busy ? "Importing…" : "Import selected"}
          </button>
          <button className="secondary" disabled={busy || !visible.length} onClick={() => importParts(visible.map((part) => part.id))} type="button">
            Import all {filter === "ALL" ? "meta" : typeLabels[filter].toLowerCase() + "s"}
          </button>
        </div>
        {error ? <p className="danger">{error}</p> : null}
      </div>
    </details>
  );
}
