export default function Loading() {
  return (
    <section className="band" aria-hidden="true">
      <h1>
        <span className="skeleton skeleton--title" style={{ display: "inline-block", width: "13rem" }} />
      </h1>
      <p>
        <span className="skeleton skeleton--line" style={{ display: "inline-block", width: "100%", maxWidth: "32rem" }} />
      </p>
      <div className="card skeleton-card">
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--button" />
      </div>
    </section>
  );
}