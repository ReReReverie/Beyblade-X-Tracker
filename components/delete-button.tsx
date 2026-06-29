"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ endpoint, id, label }: { endpoint: "parts" | "combos"; id: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    const response = await fetch(`/api/${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Delete failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="delete-control delete-control--compact">
      <button className="button button-small button-danger" type="button" onClick={remove}>{label}</button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
