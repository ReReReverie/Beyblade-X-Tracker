"use client";

import { useState } from "react";

export function StarButton({ comboId, initialCount, initiallyStarred }: { comboId: string; initialCount: number; initiallyStarred: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [starred, setStarred] = useState(initiallyStarred);
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    const response = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comboId })
    });
    if (!response.ok) {
      setError("Sign in to follow.");
      return;
    }
    const data = await response.json();
    setStarred(data.starred);
    setCount(data.count);
  }

  return (
    <div className="star-wrap">
      <button className={starred ? "star-button star-button--on" : "star-button"} type="button" onClick={toggle}>
        {starred ? "Following" : "Follow"} ({count})
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
