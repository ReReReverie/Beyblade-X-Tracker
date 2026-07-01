"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminComboDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${name}" and its related battle/deck data?`)) return;

    setError("");
    setDeleting(true);
    const response = await fetch(`/api/admin/combos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Delete failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="delete-control">
      <button className="button button-small button-danger" type="button" onClick={remove} disabled={deleting}>
        {deleting ? "Deleting" : "Delete"}
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
