"use client";

import { FormEvent, useState } from "react";

export function ReportForm() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: form.get("kind"),
        title: form.get("title"),
        details: form.get("details"),
        path: window.location.pathname
      })
    });
    setMessage(response.ok ? "Sent." : "Could not send.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form onSubmit={submit}>
      <h2>Report</h2>
      <label>Type<select name="kind"><option value="BUG">Bug</option><option value="REQUEST">Request</option></select></label>
      <label>Title<input name="title" required minLength={3} maxLength={120} /></label>
      <label>Details<textarea name="details" required minLength={5} maxLength={2000} /></label>
      <button type="submit">Send report</button>
      {message ? <p className="meta">{message}</p> : null}
    </form>
  );
}
