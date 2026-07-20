"use client";

import { useState } from "react";
import { hideLoadingOverlay, showLoadingOverlay } from "@/components/loading-overlay-events";

export function PutComboButton({ comboId, initialCount, initiallyPut }: { comboId: string; initialCount: number; initiallyPut: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [put, setPut] = useState(initiallyPut);
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    showLoadingOverlay();
    try {
      const response = await fetch("/api/combo-puts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not update your lineup.");
        return;
      }
      setPut(data.put);
      setCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your lineup.");
    } finally {
      hideLoadingOverlay();
    }
  }

  return (
    <div className="star-wrap">
      <button className={put ? "star-button star-button--on" : "star-button"} type="button" onClick={toggle}>
        {put ? "In lineup" : "Put combo"} ({count})
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
