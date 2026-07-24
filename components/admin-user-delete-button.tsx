"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserDeleteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete the account for "${label}" and all of its data? This cannot be undone.`)) return;

    setError("");
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Delete failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="delete-control">
      <button className="button button-small button-danger" type="button" onClick={remove} disabled={deleting}>
        {deleting ? "Deleting" : "Delete account"}
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
