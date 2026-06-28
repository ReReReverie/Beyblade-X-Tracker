import { notFound } from "next/navigation";
import { WRGraph } from "@/components/wr-graph";
import { formatManufacturer, formatPartType, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const combo = await prisma.combo.findFirst({
    where: { id, visibility: "PUBLIC" },
    include: {
      parts: { include: { part: { include: { photos: { where: { visibility: "PUBLIC" }, take: 1 } } } } },
      photos: { where: { visibility: "PUBLIC" }, take: 4 },
      wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
      battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
    }
  });

  if (!combo) notFound();

  const wins = combo.wins.length;
  const total = combo.battlesA.length + combo.battlesB.length;
  const battleHistory = await prisma.battle.findMany({
    where: { visibility: "PUBLIC", OR: [{ comboAId: combo.id }, { comboBId: combo.id }] },
    orderBy: { playedAt: "desc" },
    take: 120
  });

  return (
    <div className="combo-detail">
      <section className="combo-detail__left">
        <div className="band">
          <span className="tag tag--filled">Combo report</span>
          <h1>{combo.name}</h1>
          <p>
            {comboWeight(combo).toFixed(2)} g total - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
          </p>
          <WRGraph comboId={combo.id} battles={battleHistory} />
        </div>
      </section>
      <section className="combo-detail__right list">
        <h2>Parts</h2>
        {combo.parts.map(({ part, role }) => (
          <div className="card part-card" key={part.id}>
            {part.photos[0] ? (
              <img className="photo" src={part.photos[0].url.replace("http://", "https://")} alt={part.name} />
            ) : (
              <div className="photo" aria-hidden="true" />
            )}
            <div>
              <span className="tag">{formatPartType(role)}</span>
              <h3>{part.name}</h3>
              <p className="meta">
                {formatManufacturer(part.manufacturer)} - {Number(part.weightGrams).toFixed(2)} g - Condition {Number(part.conditionRating)}/10
              </p>
              {part.notes ? <p>{part.notes}</p> : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
