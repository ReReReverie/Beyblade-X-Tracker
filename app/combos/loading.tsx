export default function Loading() {
  return (
    <div className="list" aria-hidden="true">
      <h1>
        <span className="skeleton skeleton--title" style={{ display: "inline-block", width: "12rem" }} />
      </h1>
      <section className="featured-combos">
        <h2>
          <span className="skeleton skeleton--title" style={{ display: "inline-block", width: "10rem" }} />
        </h2>
        <div className="featured-grid">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="card skeleton-card" key={index}>
              <div className="skeleton skeleton--line skeleton--title" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--chart" />
              <div className="skeleton skeleton--button" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>
          <span className="skeleton skeleton--title" style={{ display: "inline-block", width: "8rem" }} />
        </h2>
        <div className="grid">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="card skeleton-card" key={index}>
              <div className="skeleton skeleton--line skeleton--title" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line" />
            </div>
          ))}
        </div>
      </section>
      <h2>
        <span className="skeleton skeleton--title" style={{ display: "inline-block", width: "11rem" }} />
      </h2>
      <div className="grid public-combo-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="card skeleton-card" key={index}>
            <div className="skeleton skeleton--line skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--chart" />
            <div className="skeleton skeleton--button" />
          </div>
        ))}
      </div>
    </div>
  );
}