"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ComboVisibilityForm({ comboId, initialVisibility }: { comboId: string; initialVisibility: "PUBLIC" | "PRIVATE" }) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initialVisibility);
  const [error, setError] = useState("");

  async function update(nextVisibility: "PUBLIC" | "PRIVATE") {
    setVisibility(nextVisibility);
    setError("");
    const response = await fetch("/api/combos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comboId, visibility: nextVisibility })
    });
    if (!response.ok) {
      setVisibility(visibility);
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Could not update visibility.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="inline-control">
      <label>
        Post access
        <select value={visibility} onChange={(event) => update(event.target.value as "PUBLIC" | "PRIVATE")}>
          <option value="PUBLIC">Public: others can add battle data</option>
          <option value="PRIVATE">Private: only you can add battle data</option>
        </select>
      </label>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
