import Link from "next/link";

export const revalidate = 3600;

export default function Home() {
  return (
    <div className="list">
      <section className="hero">
        <div>
          <h1>Track what actually wins, not only what is meta.</h1>
          <p>
            Log Beyblade X parts by source, weight, wear rating, and photos. Build combos, record
            simple win-loss results, and compare off-meta experiments against real testing data.
          </p>
          <div className="navlinks">
            <Link className="button" href="/auth/signup">Create account</Link>
            <Link className="button secondary" href="/combos">Browse combos</Link>
          </div>
        </div>
      </section>
      <section>
        <h2>Public testing data</h2>
        <p className="meta">
          Browse public combos to compare part weights, condition ratings, win-loss records, and battle history.
        </p>
        <Link className="button secondary" href="/combos">Open public combos</Link>
      </section>
    </div>
  );
}
