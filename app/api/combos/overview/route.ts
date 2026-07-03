import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
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

  return applyCacheHeaders(NextResponse.json({
    combos: combos.map((combo) => ({
      ...combo,
      initiallyStarred: combo.stars.some((star) => star.userId === session?.user?.id),
      initiallyPut: combo.puts.some((put) => put.userId === session?.user?.id)
    })),
    decks,
    features: [...activeFeatures, ...automaticFeatures],
    battleHistory
  }), publicCacheControl, "Cookie");
}