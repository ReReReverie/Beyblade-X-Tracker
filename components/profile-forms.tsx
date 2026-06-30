"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

async function sendJson(url: string, method: string, data?: unknown) {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Save failed.");
  }
}

export function ProfileEditForm({ name, image, bio }: { name?: string | null; image?: string | null; bio?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await sendJson("/api/profile", "PATCH", Object.fromEntries(form));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Edit profile</h2>
      <label>Display name<input name="name" defaultValue={name || ""} /></label>
      <label>Profile picture URL<input name="image" type="url" defaultValue={image || ""} placeholder="https://..." /></label>
      <label>Short description<textarea name="bio" defaultValue={bio || ""} maxLength={280} /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save profile</button>
    </form>
  );
}

export function CareerEntryForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await sendJson("/api/profile", "POST", Object.fromEntries(form));
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Add tournament</h2>
      <label>Tournament<input name="tournamentName" required /></label>
      <label>Date<input name="playedAt" type="date" required /></label>
      <label>Placement<input name="placement" placeholder="Top 8, 1st, 3-2 Swiss" /></label>
      <div className="form-grid">
        <label>Wins<input name="wins" type="number" min="0" defaultValue="0" /></label>
        <label>Losses<input name="losses" type="number" min="0" defaultValue="0" /></label>
        <label>Draws<input name="draws" type="number" min="0" defaultValue="0" /></label>
      </div>
      <label>Notes<textarea name="notes" /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Save tournament</button>
    </form>
  );
}

export function CareerDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    try {
      await sendJson(`/api/profile?id=${encodeURIComponent(id)}`, "DELETE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="delete-control delete-control--compact">
      <button className="button button-small button-danger" type="button" onClick={remove}>Delete</button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
