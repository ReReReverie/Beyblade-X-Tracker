"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="band" role="alert">
      <span className="tag tag--filled">Dashboard unavailable</span>
      <h1>We could not load this section.</h1>
      <p className="meta">Your saved data was not changed. Try again in a moment.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}