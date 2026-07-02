import Link from "next/link";
import { getServerSession } from "next-auth";
import { PutComboButton } from "@/components/put-combo-button";
import { WRGraph } from "@/components/wr-graph";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

const autoSlots = [
  { slot: "DAY", title: "Combo of the day" },
  { slot: "WEEK", title: "Combo of the week" },
  { slot: "MONTH", title: "Combo of the month" }
] as const;

function periodIndex(slot: "DAY" | "WEEK" | "MONTH", now: Date) {
  const day = Math.floor(now.getTime() / 86_400_000);
  if (slot === "DAY") return day;
  if (slot === "WEEK") return Math.floor(day / 7);
  return now.getUTCFullYear() * 12 + now.getUTCMonth();
}

export default async function CombosPage() {
  const session = await getServerSession(authOptions);
  const now = new Date();
  const [combos, decks, activeFeatures] = await Promise.all([
    prisma.combo.findMany({
      where: { visibility: "PUBLIC" },
      include: {
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        owner: { select: { name: true, username: true } },
        stars: { select: { userId: true } },
        puts: { select: { userId: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 36
    }),
    prisma.deck.findMany({
      where: { visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        slots: { include: { combo: true }, orderBy: { slot: "asc" } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 18
    }),
    prisma.featuredCombo.findMany({
      where: { startsAt: { lte: now }, endsAt: { gt: now }, combo: { visibility: "PUBLIC" } },
      include: {
        combo: {
          include: {
            parts: { include: { part: true }, orderBy: { role: "asc" } },
            photos: { where: { visibility: "PUBLIC" }, take: 1 },
            owner: { select: { name: true, username: true } },
            stars: { select: { userId: true } },
            puts: { select: { userId: true } },
            wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
            battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
            battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
          }
        }
      },
      orderBy: [{ slot: "asc" }, { createdAt: "desc" }],
      take: 12
    })
  ]);
  const comboIds = combos.map((combo) => combo.id);
  const battleHistory = comboIds.length
    ? await prisma.battle.findMany({
        where: { visibility: "PUBLIC", OR: [{ comboAId: { in: comboIds } }, { comboBId: { in: comboIds } }] },
        orderBy: { playedAt: "desc" },
        take: 720
      })
    : [];
  const manualFeatureBySlot = new Map(activeFeatures.map((feature) => [feature.slot, feature]));
  const automaticFeatures = autoSlots
    .filter(({ slot }) => !manualFeatureBySlot.has(slot))
    .map(({ slot, title }) => {
      if (!combos.length) return null;
      const combo = combos[periodIndex(slot, now) % combos.length];
      return { id: `auto-${slot}`, slot, title, sponsorName: null, posterUrl: null, combo };
    })
    .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature));
  const features = [...activeFeatures, ...automaticFeatures];

  return (
    <div className="list">
      <h1>Public combos</h1>
      {features.length ? (
        <section className="featured-combos">
          <h2>Featured combos</h2>
          <div className="featured-grid">
            {features.map((feature) => {
              const combo = feature.combo;
              const wins = combo.wins.length;
              const total = combo.battlesA.length + combo.battlesB.length;
              return (
                <Link className="card featured-card" key={feature.id} href={`/combos/${combo.id}`}>
                  <span className="tag tag--filled">{feature.slot === "SPONSOR" ? "Sponsored" : feature.slot.toLowerCase()}</span>
                  {feature.posterUrl || combo.photos[0] ? <img className="photo featured-card__photo" src={feature.posterUrl || combo.photos[0]?.url} alt="" /> : null}
                  <h3>{feature.title}</h3>
                  <strong>{combo.name}</strong>
                  <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                  {feature.sponsorName ? <p className="meta">Presented by {feature.sponsorName}</p> : null}
                  <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      {decks.length ? (
        <section>
          <h2>Public decks</h2>
          <div className="grid">
            {decks.map((deck) => {
              const wins = deck.wins.length;
              const total = deck.battlesA.length + deck.battlesB.length;
              return (
                <div className="card" key={deck.id}>
                  <span className="tag tag--filled">3v3 deck</span>
                  <h2>{deck.name}</h2>
                  <p className="meta">Creator: {deck.owner.name || deck.owner.username || "Unknown"}</p>
                  <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                  <p className="meta">{deck.slots.map((slot) => slot.combo.name).join(" / ")}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <h2>Public 1v1 combos</h2>
      {combos.length ? (
      <div className="grid public-combo-grid">
        {combos.map((combo) => {
          const wins = combo.wins.length;
          const total = combo.battlesA.length + combo.battlesB.length;
          return (
            <Link className="card public-combo-card" key={combo.id} href={`/combos/${combo.id}`}>
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
              <PutComboButton
                comboId={combo.id}
                initialCount={combo.puts.length}
                initiallyPut={combo.puts.some((put) => put.userId === session?.user?.id)}
              />
            </Link>
          );
        })}
      </div>
      ) : (
        <p className="meta">No public combos yet. Import parts from the catalog in your dashboard, build a combo, set visibility to Public, and it will appear here.</p>
      )}
    </div>
  );
}
