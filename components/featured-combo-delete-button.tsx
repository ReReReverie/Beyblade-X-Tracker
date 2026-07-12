"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeaturedComboDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function remove() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/featured-combos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Delete failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="delete-control">
      <button className="button button-small button-danger" type="button" onClick={remove} disabled={loading}>
        {loading ? "Deleting\u2026" : "Delete"}
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
