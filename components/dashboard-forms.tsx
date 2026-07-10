"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hideLoadingOverlay, showLoadingOverlay } from "@/components/loading-overlay-events";

type PartRole = "BLADE" | "RATCHET" | "BIT" | "LOCK_CHIP" | "MAIN_BLADE" | "ASSIST_BLADE" | "OVER_BLADE" | "METAL_BLADE";

type Option = {
  id: string;
  name: string;
  series?: "BX" | "UX" | "CX" | "CX_EXPANDED" | null;
  role?: PartRole | null;
  ratchetIntegration?: "NONE" | "BLADE" | "BIT";
};

type ComboTab = "uxbx" | "cx" | "cxExpanded";

function tabLabel(tab: ComboTab) {
  if (tab === "cx") return "CX";
  if (tab === "cxExpanded") return "CX-Expanded";
  return "BX / UX";
}

function optionsByRole(parts: Option[], role: PartRole) {
  return parts.filter((part) => part.role === role);
}

const maxUploadBytes = 1 * 1024 * 1024;

async function postJson(url: string, data: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Save failed.");
  }
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read image."));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "upload";
    const maxSides = [1600, 1280, 1024, 800];
    const qualities = [0.82, 0.72, 0.62, 0.52];
    let bestBlob: Blob | null = null;

    for (const maxSide of maxSides) {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (!blob) continue;
        if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
        if (blob.size <= maxUploadBytes) return new File([blob], `${name}.webp`, { type: "image/webp" });
      }
    }

    if (bestBlob && bestBlob.size < file.size) return new File([bestBlob], `${name}.webp`, { type: "image/webp" });
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ComboForm({ blades, ratchets, bits }: { blades: Option[]; ratchets: Option[]; bits: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ComboTab>("uxbx");
  const [selectedBladeId, setSelectedBladeId] = useState("");
  const [selectedLockChipId, setSelectedLockChipId] = useState("");
  const [selectedMainBladeId, setSelectedMainBladeId] = useState("");
  const [selectedAssistBladeId, setSelectedAssistBladeId] = useState("");
  const [selectedOverBladeId, setSelectedOverBladeId] = useState("");
  const [selectedMetalBladeId, setSelectedMetalBladeId] = useState("");
  const [selectedRatchetId, setSelectedRatchetId] = useState("");
  const [selectedBitId, setSelectedBitId] = useState("");

  const bxUxBlades = blades.filter((part) => part.role === "BLADE" && (part.series === "BX" || part.series === "UX"));
  const lockChips = optionsByRole(blades, "LOCK_CHIP");
  const mainBlades = optionsByRole(blades, "MAIN_BLADE");
  const assistBlades = optionsByRole(blades, "ASSIST_BLADE");
  const overBlades = optionsByRole(blades, "OVER_BLADE");
  const metalBlades = optionsByRole(blades, "METAL_BLADE");
  const selectedBit = bits.find((part) => part.id === selectedBitId);
  const bitIntegrated = selectedBit?.ratchetIntegration === "BIT";

  useEffect(() => {
    setSelectedBladeId("");
    setSelectedLockChipId("");
    setSelectedMainBladeId("");
    setSelectedAssistBladeId("");
    setSelectedOverBladeId("");
    setSelectedMetalBladeId("");
    setSelectedRatchetId("");
  }, [tab]);

  useEffect(() => {
    if (bitIntegrated) setSelectedRatchetId("");
  }, [bitIntegrated]);

  function selectField(label: string, value: string, onChange: (value: string) => void, options: Option[]) {
    return (
      <label className="combo-form__field">
        <span>{label}</span>
        <select id={`combo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose {label.toLowerCase()}</option>
          {options.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
        </select>
      </label>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const mode = tab === "cx" ? "CX" : tab === "cxExpanded" ? "CX_EXPANDED" : "BX_UX";
    const requiredMissing =
      (tab === "uxbx" && !selectedBladeId) ||
      (tab === "cx" && (!selectedLockChipId || !selectedMainBladeId || !selectedAssistBladeId)) ||
      (tab === "cxExpanded" && (!selectedLockChipId || !selectedOverBladeId || !selectedMetalBladeId || !selectedAssistBladeId));
    if (requiredMissing || !selectedBitId) {
      setError("Choose all required parts before saving.");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showLoadingOverlay();
    try {
      const payload = Object.fromEntries(form) as Record<string, FormDataEntryValue>;
      payload.mode = mode;
      payload.bitId = selectedBitId;
      if (tab === "uxbx") payload.bladeId = selectedBladeId;
      if (tab === "cx") {
        payload.lockChipId = selectedLockChipId;
        payload.mainBladeId = selectedMainBladeId;
        payload.assistBladeId = selectedAssistBladeId;
      }
      if (tab === "cxExpanded") {
        payload.lockChipId = selectedLockChipId;
        payload.overBladeId = selectedOverBladeId;
        payload.metalBladeId = selectedMetalBladeId;
        payload.assistBladeId = selectedAssistBladeId;
      }
      if (bitIntegrated || !selectedRatchetId) delete payload.ratchetId;
      else payload.ratchetId = selectedRatchetId;

      await postJson("/api/combos", payload);
      formElement.reset();
      setSelectedBladeId("");
      setSelectedLockChipId("");
      setSelectedMainBladeId("");
      setSelectedAssistBladeId("");
      setSelectedOverBladeId("");
      setSelectedMetalBladeId("");
      setSelectedRatchetId("");
      setSelectedBitId("");
      setTab("uxbx");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      hideLoadingOverlay();
    }
  }

  return (
    <form className="combo-form" onSubmit={submit}>
      <h2>Build combo</h2>
      <p className="meta">Combo names are generated from selected parts automatically.</p>
      <div className="tab-buttons" role="tablist" aria-label="Part groups">
        <button type="button" className={tab === "uxbx" ? "secondary tab-button--active" : "secondary"} onClick={() => setTab("uxbx")}>BX / UX</button>
        <button type="button" className={tab === "cx" ? "secondary tab-button--active" : "secondary"} onClick={() => setTab("cx")}>CX</button>
        <button type="button" className={tab === "cxExpanded" ? "secondary tab-button--active" : "secondary"} onClick={() => setTab("cxExpanded")}>CX-Expanded</button>
      </div>

      <div className="combo-form__status" aria-live="polite">
        <span className="tag tag--filled">Series: {tabLabel(tab)}</span>
        <span className={bitIntegrated ? "tag tag--filled combo-form__tag--alert" : "tag"}>{bitIntegrated ? "Ratchet built into bit" : "Ratchet selectable"}</span>
      </div>

      {tab === "uxbx" ? selectField("Blade", selectedBladeId, setSelectedBladeId, bxUxBlades) : null}
      {tab === "cx" ? (
        <>
          {selectField("Lock Chip", selectedLockChipId, setSelectedLockChipId, lockChips)}
          {selectField("Main Blade", selectedMainBladeId, setSelectedMainBladeId, mainBlades)}
          {selectField("Assist Blade", selectedAssistBladeId, setSelectedAssistBladeId, assistBlades)}
        </>
      ) : null}
      {tab === "cxExpanded" ? (
        <>
          {selectField("Lock Chip", selectedLockChipId, setSelectedLockChipId, lockChips)}
          {selectField("Over Blade", selectedOverBladeId, setSelectedOverBladeId, overBlades)}
          {selectField("Metal Blade", selectedMetalBladeId, setSelectedMetalBladeId, metalBlades)}
          {selectField("Assist Blade", selectedAssistBladeId, setSelectedAssistBladeId, assistBlades)}
        </>
      ) : null}

      {!bitIntegrated ? (
        <label className="combo-form__field">
          <span>Ratchet</span>
          <select name="ratchetId" value={selectedRatchetId} onChange={(event) => setSelectedRatchetId(event.target.value)}>
            <option value="">No separate ratchet</option>
            {ratchets.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
          </select>
          <span className="meta">Ratchets remain fully cross-compatible.</span>
        </label>
      ) : <p className="meta combo-form__notice">Ratchet is built into this bit; no separate ratchet needed.</p>}

      <label className="combo-form__field">
        <span>Bit</span>
        <select name="bitId" value={selectedBitId} onChange={(event) => setSelectedBitId(event.target.value)}>
          <option value="">Choose a bit</option>
          {bits.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
        </select>
        <span className="meta">Turbo and Operate can be used in any tab and replace the ratchet slot.</span>
      </label>
      <label className="combo-form__field"><span>Visibility</span><select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label className="combo-form__field"><span>Notes</span><textarea name="notes" /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save combo</button>
    </form>
  );
}
export function DeckForm({ combos }: { combos: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showLoadingOverlay();
    try {
      await postJson("/api/decks", Object.fromEntries(form));
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      hideLoadingOverlay();
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Build deck</h2>
      <label>Name<input name="name" required /></label>
      <label>Combo 1<select name="comboOneId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Combo 2<select name="comboTwoId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Combo 3<select name="comboThreeId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Notes<textarea name="notes" /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save deck</button>
    </form>
  );
}

export function BattleForm({ combos, decks }: { combos: Option[]; decks: Option[] }) {
  const router = useRouter();
  const [format, setFormat] = useState("ONE_V_ONE");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showLoadingOverlay();
    try {
      await postJson("/api/battles", Object.fromEntries(form));
      formElement.reset();
      setFormat("ONE_V_ONE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      hideLoadingOverlay();
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Log battle</h2>
      <label>Format<select name="format" value={format} onChange={(event) => setFormat(event.target.value)}><option value="ONE_V_ONE">1v1 combo</option><option value="THREE_V_THREE">3v3 deck</option></select></label>
      {format === "ONE_V_ONE" ? (
        <>
          <label>Combo A<select name="comboAId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Combo B<select name="comboBId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Combo A RPM<input name="comboARpm" type="number" min="1" max="99999" step="1" /></label>
          <label>Combo B RPM<input name="comboBRpm" type="number" min="1" max="99999" step="1" /></label>
          <label>Winner<select name="winnerId">{combos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </>
      ) : (
        <>
          <label>Deck A<select name="deckAId">{decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label>Deck B<select name="deckBId">{decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label>Winner<select name="deckWinnerId">{decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        </>
      )}
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Notes<textarea name="notes" /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save battle</button>
    </form>
  );
}

export function PhotoForm({ parts, combos }: { parts: Option[]; combos: Option[] }) {
  const router = useRouter();
  const [targetType, setTargetType] = useState("part");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    showLoadingOverlay();
    try {
      const file = form.get("file");
      if (file instanceof File) {
        const compressed = await compressImage(file);
        if (compressed.size > maxUploadBytes) {
          throw new Error("Image is still over 1 MB after compression.");
        }
        form.set("file", compressed);
      }
      const response = await fetch("/api/upload", { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json()).error || "Upload failed.");
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      hideLoadingOverlay();
    }
  }

  const targets = targetType === "part" ? parts : combos;

  return (
    <form onSubmit={submit}>
      <h2>Add photo</h2>
      <p className="meta">Only parts and combos you own appear as photo targets.</p>
      <label>Photo type<select name="targetType" value={targetType} onChange={(e) => setTargetType(e.target.value)}><option value="part">Part</option><option value="combo">Combo</option></select></label>
      <label>Target<select name="targetId">{targets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
      <p className="meta">Images are compressed to WebP before upload. Max 1 MB.</p>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Upload photo</button>
    </form>
  );
}

