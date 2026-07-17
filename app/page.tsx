import Link from "next/link";

export const revalidate = 3600;

export default function Home() {
  return (
    <div className="list">
      <section className="hero debut-hero">
        <div className="debut-hero__copy">
          <p className="debut-kicker">// The launch log · Beyblade X</p>
          <h1>Stop guessing.<br /><span>Start testing.</span></h1>
          <p className="debut-hero__lede">The public tracker for bladers who want receipts. Log your parts, build your combos, and see what actually survives the stadium.</p>
          <div className="navlinks"><Link className="button debut-hero__cta" href="/auth/signup">Enter the lab <span aria-hidden="true">↗</span></Link><Link className="button secondary" href="/combos">Browse live data</Link></div>
        </div>
        <div className="debut-hero__visual" aria-label="A test card showing a Beyblade combo under review">
          <div className="debut-orbit debut-orbit--outer" /><div className="debut-orbit debut-orbit--inner" /><div className="debut-bey" aria-hidden="true"><span>X</span></div>
          <div className="debut-sticker debut-sticker--top">DATA<br />OVER<br />HYPE</div><div className="debut-sticker debut-sticker--bottom">TEST<br />→<br />REPEAT</div><p className="debut-coordinate">35°41′N<br />139°41′E</p>
        </div>
      </section>

      <section className="debut-proof" aria-label="Tracker highlights">
        <div className="debut-proof__intro"><p className="debut-kicker">01 / Why it exists</p><h2>Your setup.<br />Your evidence.</h2></div>
        <div className="debut-proof__grid">
          <article className="debut-proof__item"><strong>01</strong><h3>Build with detail</h3><p>Parts, weights, wear, sources, photos. Capture the variables that change a launch.</p></article>
          <article className="debut-proof__item"><strong>02</strong><h3>Battle for proof</h3><p>Record simple win-loss results and turn every session into a useful data point.</p></article>
          <article className="debut-proof__item"><strong>03</strong><h3>Share what works</h3><p>Browse public combos, compare experiments, and find signal beyond the meta.</p></article>
        </div>
      </section>

      <section className="debut-manifesto"><p className="debut-kicker">// First post</p><p className="debut-manifesto__quote">“The best combo is the one you can prove.”</p><div className="debut-manifesto__footer"><span>Public beta · Now logging</span><Link href="/combos">See the scoreboard ↗</Link></div></section>
    </div>
  );
}
