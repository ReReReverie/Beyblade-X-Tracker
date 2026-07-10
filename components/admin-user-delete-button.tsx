"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUserDeleteButtonProps = {
  id: string;
  label: string;
  disabled?: boolean;
};

export function AdminUserDeleteButton({ id, label, disabled = false }: AdminUserDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    const confirmations = [
      `Delete account "${label}"? This removes their parts, combos, decks, battles, comments, profile, and auth data.`,
      `Second check: permanently delete "${label}" and all owned tracker data?`,
      `Final check: this cannot be undone. Delete "${label}" now?`
    ];

    for (const message of confirmations) {
      if (!window.confirm(message)) return;
    }

    setError("");
    setDeleting(true);
    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
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
      <button className="button button-small button-danger" type="button" onClick={remove} disabled={disabled || deleting}>
        {deleting ? "Deleting" : disabled ? "Current admin" : "Delete account"}
      </button>
      {error ? <span className="meta danger">{error}</span> : null}
    </div>
  );
}
