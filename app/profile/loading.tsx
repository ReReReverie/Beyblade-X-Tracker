export default function ProfileLoading() {
  return (
    <section className="list" role="status" aria-live="polite" aria-label="Loading profile">
      <div className="band">
        <span className="skeleton skeleton--line skeleton--title" />
        <span className="skeleton skeleton--line skeleton--wide" />
      </div>
      <nav className="dashboard-tabs" aria-label="Loading profile sections">
        <span className="skeleton skeleton--button" />
        <span className="skeleton skeleton--button" />
        <span className="skeleton skeleton--button" />
      </nav>
      <div className="card skeleton-card">
        <span className="skeleton skeleton--line skeleton--title" />
        <span className="skeleton skeleton--line skeleton--wide" />
        <span className="skeleton skeleton--line" />
      </div>
    </section>
  );
}
