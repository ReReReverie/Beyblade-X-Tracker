import Link from "next/link";
import { getServerSession } from "next-auth";
import { WRGraph } from "@/components/wr-graph";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const session = await getServerSession(authOptions);
  const combos = await prisma.combo.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      parts: { include: { part: true }, orderBy: { role: "asc" } },
      photos: { where: { visibility: "PUBLIC" }, take: 1 },
      owner: { select: { name: true, username: true } },
      stars: { select: { userId: true } },
      wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 36
  });
  const comboIds = combos.map((combo) => combo.id);
  const battleHistory = comboIds.length
    ? await prisma.battle.findMany({
        where: { visibility: "PUBLIC", OR: [{ comboAId: { in: comboIds } }, { comboBId: { in: comboIds } }] },
        orderBy: { playedAt: "desc" },
        take: 720
      })
    : [];

  return (
    <div className="list">
      <h1>Public combos</h1>
      <div className="grid">
        {combos.map((combo) => {
          const wins = combo.wins.length;
          const total = combo.battlesA.length + combo.battlesB.length;
          return (
            <Link className="card" key={combo.id} href={`/combos/${combo.id}`}>
              {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
              <h2>{combo.name}</h2>
              <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
              <p className="meta">
                {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
              </p>
              <p className="meta">
                {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
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
    </div>
  );
}
