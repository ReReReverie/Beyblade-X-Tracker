"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ComboOption = { id: string; name: string };

export function FeaturedComboForm({ combos }: { combos: ComboOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const response = await fetch("/api/featured-combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form))
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Save failed.");
      }
      formElement.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Feature combo</h2>
      <label>Combo<select name="comboId" required>{combos.map((combo) => <option key={combo.id} value={combo.id}>{combo.name}</option>)}</select></label>
      <label>Placement<select name="slot"><option value="DAY">Combo of the day</option><option value="WEEK">Combo of the week</option><option value="MONTH">Combo of the month</option><option value="SPONSOR">Sponsored poster</option></select></label>
      <label>Title<input name="title" required placeholder="Sponsored spotlight" /></label>
      <label>Sponsor / poster name<input name="sponsorName" placeholder="Brand, creator, celebrity" /></label>
      <label>Poster image URL<input name="posterUrl" type="url" placeholder="https://..." /></label>
      <label>Starts<input name="startsAt" type="datetime-local" required /></label>
      <label>Ends<input name="endsAt" type="datetime-local" required /></label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Post feature</button>
    </form>
  );
}
