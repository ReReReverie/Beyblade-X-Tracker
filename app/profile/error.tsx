"use client";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <section className="band" role="alert">
      <span className="tag tag--filled">Profile unavailable</span>
      <h1>We could not load this profile.</h1>
      <p className="meta">Your data was not changed. Try again, or return to the dashboard.</p>
      <button type="button" onClick={reset}>Try again</button>
    </section>
  );
}