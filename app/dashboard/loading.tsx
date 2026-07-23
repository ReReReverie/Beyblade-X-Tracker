export default function DashboardLoading() {
  return (
    <section className="list" role="status" aria-live="polite" aria-label="Loading dashboard">
      <div className="band"><span className="skeleton skeleton--line skeleton--title" /></div>
      <div className="grid">
        <div className="card skeleton-card"><span className="skeleton skeleton--line skeleton--title" /><span className="skeleton skeleton--line" /></div>
        <div className="card skeleton-card"><span className="skeleton skeleton--line skeleton--title" /><span className="skeleton skeleton--line" /></div>
      </div>
    </section>
  );
}
