"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  body: string;
  createdAt: Date | string;
  author: { name: string | null; username: string | null };
};

export function ComboComments({ comboId, comments, signedIn }: { comboId: string; comments: Comment[]; signedIn: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId, body })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Comment failed.");
      }
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comment failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card comments">
      <h2>Comments</h2>
      {signedIn ? (
        <form onSubmit={submit}>
          <label>
            Add comment
            <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} required />
          </label>
          {error ? <p className="danger">{error}</p> : null}
          <button type="submit" disabled={saving}>{saving ? "Posting..." : "Post comment"}</button>
        </form>
      ) : (
        <p className="meta">Sign in to comment.</p>
      )}
      <div className="comment-list">
        {comments.length ? comments.map((comment) => (
          <article className="comment" key={comment.id}>
            <strong>{comment.author.name || comment.author.username || "Unknown blader"}</strong>
            <p>{comment.body}</p>
            <span className="meta">{new Date(comment.createdAt).toLocaleString()}</span>
          </article>
        )) : <p className="meta">No comments yet.</p>}
      </div>
    </section>
  );
}
