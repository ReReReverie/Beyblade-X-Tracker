import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ComboComments } from "@/components/combo-comments";
import { ComboDetailTabs } from "@/components/combo-detail-tabs";
import { ComboVisibilityForm } from "@/components/combo-visibility-form";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { formatManufacturer, formatPartType, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const combo = await prisma.combo.findFirst({
    where: { id, OR: [{ visibility: "PUBLIC" }, { ownerId: session?.user?.id || "" }] },
    include: {
      parts: { include: { part: { include: { photos: { where: { visibility: "PUBLIC" }, take: 1 } } } } },
      owner: { select: { name: true, username: true } },
      photos: { where: { visibility: "PUBLIC" }, take: 4 },
      stars: { select: { userId: true } },
      puts: { select: { userId: true } },
      comments: {
        include: { author: { select: { name: true, username: true } } },
        orderBy: { createdAt: "desc" },
        take: 50
      },
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
    include: { comboA: { select: { name: true } }, comboB: { select: { name: true } }, winner: { select: { name: true } } },
    orderBy: { playedAt: "desc" },
    take: 120
  });

  return (
    <div className="combo-detail">
      <section className="combo-detail__left">
        <div className="band">
          <span className="tag tag--filled">Combo report</span>
          <h1>{combo.name}</h1>
          <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
          <p>
            {comboWeight(combo).toFixed(2)} g total - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
          </p>
          {combo.ownerId === session?.user?.id ? (
            <ComboVisibilityForm comboId={combo.id} initialVisibility={combo.visibility} />
          ) : null}
          <ComboDetailTabs comboId={combo.id} battles={battleHistory} />
          <StarButton
            comboId={combo.id}
            initialCount={combo.stars.length}
            initiallyStarred={combo.stars.some((star) => star.userId === session?.user?.id)}
          />
          <PutComboButton
            comboId={combo.id}
            initialCount={combo.puts.length}
            initiallyPut={combo.puts.some((put) => put.userId === session?.user?.id)}
          />
          <ComboComments comboId={combo.id} comments={combo.comments} signedIn={Boolean(session?.user?.id)} />
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
