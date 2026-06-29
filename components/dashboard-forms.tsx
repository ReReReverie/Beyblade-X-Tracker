"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

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

export function PartForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await postJson("/api/parts", Object.fromEntries(form));
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Add part</h2>
      <label>Name<input name="name" required /></label>
      <label>Type<select name="type"><option value="BLADE">Blade</option><option value="RATCHET">Ratchet</option><option value="BIT">Bit</option></select></label>
      <label>Manufacturer<select name="manufacturer"><option value="UNKNOWN">Unknown</option><option value="HASBRO">Hasbro</option><option value="TAKARA_TOMY">Takara Tomy</option><option value="FAKE">Fake</option></select></label>
      <label>Weight grams<input name="weightGrams" type="number" step="0.01" min="0.01" required /></label>
      <label>Condition / 10<input name="conditionRating" type="number" step="0.1" min="0" max="10" required /></label>
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Notes<textarea name="notes" /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save part</button>
    </form>
  );
}

export function ComboForm({ blades, ratchets, bits }: { blades: Option[]; ratchets: Option[]; bits: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await postJson("/api/combos", Object.fromEntries(form));
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Build combo</h2>
      <label>Name<input name="name" required /></label>
      <label>Blade<select name="bladeId">{blades.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Ratchet<select name="ratchetId">{ratchets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Bit<select name="bitId">{bits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Notes<textarea name="notes" /></label>
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
    try {
      await postJson("/api/decks", Object.fromEntries(form));
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
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
    try {
      await postJson("/api/battles", Object.fromEntries(form));
      formElement.reset();
      setFormat("ONE_V_ONE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
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
    try {
      const response = await fetch("/api/upload", { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json()).error || "Upload failed.");
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  const targets = targetType === "part" ? parts : combos;

  return (
    <form onSubmit={submit}>
      <h2>Add photo</h2>
      <label>Photo type<select name="targetType" value={targetType} onChange={(e) => setTargetType(e.target.value)}><option value="part">Part</option><option value="combo">Combo</option></select></label>
      <label>Target<select name="targetId">{targets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Visibility<select name="visibility"><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>
      <label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Upload photo</button>
    </form>
  );
}
