"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeaturedComboDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    const response = await fetch(`/api/featured-combos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Delete failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="delete-control">
      <button className="button button-small button-danger" type="button" onClick={remove}>Delete</button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
