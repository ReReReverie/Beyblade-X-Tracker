export default function Loading() {
  return (
    <div className="combo-detail" aria-hidden="true">
      <section className="combo-detail__left">
        <div className="band">
          <div className="skeleton skeleton--line skeleton--title" style={{ width: "8rem" }} />
          <div className="skeleton skeleton--line skeleton--title" style={{ width: "70%", marginTop: "1rem" }} />
          <div className="skeleton skeleton--line" style={{ width: "50%", marginTop: "1rem" }} />
          <div className="skeleton skeleton--line" style={{ width: "80%", marginTop: "1rem" }} />
        </div>
      </section>
      <section className="combo-detail__right list">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="card skeleton-card" key={index}>
            <div className="skeleton skeleton--line skeleton--title" />
            <div className="skeleton skeleton--chart" />
          </div>
        ))}
      </section>
    </div>
  );
}