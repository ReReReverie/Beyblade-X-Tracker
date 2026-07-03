import Link from "next/link";
import { getServerSession } from "next-auth";
import { WRGraph } from "@/components/wr-graph";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const combos = await prisma.combo.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      parts: { include: { part: true } },
      owner: { select: { name: true, username: true } },
      stars: { select: { userId: true } },
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
        {combos.length ? (
        <div className="grid">
          {combos.map((combo) => {
            const wins = combo.wins.length;
            const total = combo.battlesA.length + combo.battlesB.length;
            return (
              <Link className="card" key={combo.id} href={`/combos/${combo.id}`}>
                <h3>{combo.name}</h3>
                <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                <p className="meta">
                  {comboWeight(combo) !== null ? `${comboWeight(combo).toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
                </p>
                <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battleHistory)} />
                <StarButton
                  comboId={combo.id}
                  initialCount={combo.stars.length}
                  initiallyStarred={combo.stars.some((star) => star.userId === session?.user?.id)}
                />
              </Link>
            );
          })}
        </div>
        ) : (
          <p className="meta">No public combos yet. Be the first to post one from your dashboard.</p>
        )}
      </section>
    </div>
  );
}
