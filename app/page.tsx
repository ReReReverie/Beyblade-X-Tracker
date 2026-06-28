import Link from "next/link";
import { WRGraph } from "@/components/wr-graph";
import { battlesForCombo } from "@/lib/battle-history";
import { pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const combos = await prisma.combo.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      parts: { include: { part: true } },
      wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 6
  });
  const comboIds = combos.map((combo) => combo.id);
  const battleHistory = comboIds.length
    ? await prisma.battle.findMany({
        where: { visibility: "PUBLIC", OR: [{ comboAId: { in: comboIds } }, { comboBId: { in: comboIds } }] },
        orderBy: { playedAt: "desc" },
        take: 360
      })
    : [];

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
        <div className="grid">
          <div className="stat"><strong>{combos.length}</strong><span className="meta">recent public combos</span></div>
          <div className="stat"><strong>0-10</strong><span className="meta">part condition scale</span></div>
          <div className="stat"><strong>Hasbro / TT / Fake</strong><span className="meta">source labels per part</span></div>
        </div>
      </section>
      <section>
        <h2>Recent public builds</h2>
        <div className="grid">
          {combos.map((combo) => {
            const wins = combo.wins.length;
            const total = combo.battlesA.length + combo.battlesB.length;
            return (
              <Link className="card" key={combo.id} href={`/combos/${combo.id}`}>
                <h3>{combo.name}</h3>
                <p className="meta">
                  {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
                </p>
                <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battleHistory)} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
