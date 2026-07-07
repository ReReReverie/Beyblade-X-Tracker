import { prisma } from "@/lib/prisma";

type PublicPart = {
  id: string;
  name: string;
  manufacturer: "HASBRO" | "TAKARA_TOMY" | "FAKE" | "UNKNOWN";
  weightGrams: number | null;
  conditionRating: number;
};

export type PublicCombo = {
  id: string;
  name: string;
  owner: { name: string | null; username: string | null };
  photos: Array<{ url: string }>;
  parts: Array<{ part: PublicPart }>;
  starsCount: number;
  putsCount: number;
  winsCount: number;
  battlesACount: number;
  battlesBCount: number;
  initiallyStarred: false;
  initiallyPut: false;
};

export type PublicBattle = {
  id: string;
  comboAId: string | null;
  comboBId: string | null;
  winnerId: string | null;
  playedAt: string;
};

export type PublicDeck = {
  id: string;
  name: string;
  owner: { name: string | null; username: string | null };
  slots: Array<{ combo: { id: string; name: string } }>;
  winsCount: number;
  battlesACount: number;
  battlesBCount: number;
};

export type PublicFeature = {
  id: string;
  slot: "DAY" | "WEEK" | "MONTH" | "SPONSOR";
  title: string;
  sponsorName: string | null;
  posterUrl: string | null;
  combo: PublicCombo;
};

const publicDataTimingEnabled = process.env.PUBLIC_DATA_TIMING === "true";

async function timed<T>(label: string, action: () => Promise<T>) {
  if (!publicDataTimingEnabled) return action();
  const start = performance.now();
  try {
    return await action();
  } finally {
    console.log(`[public-data] ${label}: ${Math.round(performance.now() - start)}ms`);
  }
}

const autoSlots = [
  { slot: "DAY", title: "Combo of the day" },
  { slot: "WEEK", title: "Combo of the week" },
  { slot: "MONTH", title: "Combo of the month" }
] as const;

const comboSelect = {
  id: true,
  name: true,
  owner: { select: { name: true, username: true } },
  photos: { where: { visibility: "PUBLIC" as const }, select: { url: true }, take: 1 },
  parts: {
    select: {
      part: {
        select: {
          id: true,
          name: true,
          manufacturer: true,
          weightGrams: true,
          conditionRating: true
        }
      }
    },
    orderBy: { role: "asc" as const }
  },
  _count: {
    select: {
      stars: true,
      puts: true,
      wins: { where: { visibility: "PUBLIC" as const } },
      battlesA: { where: { visibility: "PUBLIC" as const } },
      battlesB: { where: { visibility: "PUBLIC" as const } }
    }
  }
};

function periodIndex(slot: "DAY" | "WEEK" | "MONTH", now: Date) {
  const day = Math.floor(now.getTime() / 86_400_000);
  if (slot === "DAY") return day;
  if (slot === "WEEK") return Math.floor(day / 7);
  return now.getUTCFullYear() * 12 + now.getUTCMonth();
}

function serializeCombo(combo: any): PublicCombo {
  return {
    id: combo.id,
    name: combo.name,
    owner: combo.owner,
    photos: combo.photos,
    parts: combo.parts.map((entry: any) => ({
      part: {
        ...entry.part,
        weightGrams: entry.part.weightGrams == null ? null : Number(entry.part.weightGrams),
        conditionRating: Number(entry.part.conditionRating)
      }
    })),
    starsCount: combo._count.stars,
    putsCount: combo._count.puts,
    winsCount: combo._count.wins,
    battlesACount: combo._count.battlesA,
    battlesBCount: combo._count.battlesB,
    initiallyStarred: false,
    initiallyPut: false
  };
}

function serializeBattle(battle: { id: string; comboAId: string | null; comboBId: string | null; winnerId: string | null; playedAt: Date }): PublicBattle {
  return { ...battle, playedAt: battle.playedAt.toISOString() };
}

export async function getPublicHomeData() {
  const combos = await timed("home combos query", () => prisma.combo.findMany({
    where: { visibility: "PUBLIC" },
    select: comboSelect,
    orderBy: { createdAt: "desc" },
    take: 6
  }));

  const publicCombos = combos.map(serializeCombo);
  const comboIds = publicCombos.map((combo) => combo.id);
  const battleHistory = comboIds.length
    ? await timed("home battle history query", () => prisma.battle.findMany({
        where: { visibility: "PUBLIC", OR: [{ comboAId: { in: comboIds } }, { comboBId: { in: comboIds } }] },
        select: { id: true, comboAId: true, comboBId: true, winnerId: true, playedAt: true },
        orderBy: { playedAt: "desc" },
        take: 360
      }))
    : [];

  return { combos: publicCombos, battleHistory: battleHistory.map(serializeBattle) };
}

export async function getPublicCombosOverviewData() {
  const now = new Date();
  const [combos, decks, activeFeatures] = await Promise.all([
    timed("overview combos query", () => prisma.combo.findMany({
      where: { visibility: "PUBLIC" },
      select: comboSelect,
      orderBy: { createdAt: "desc" },
      take: 36
    })),
    timed("overview decks query", () => prisma.deck.findMany({
      where: { visibility: "PUBLIC" },
      select: {
        id: true,
        name: true,
        owner: { select: { name: true, username: true } },
        slots: { select: { combo: { select: { id: true, name: true } } }, orderBy: { slot: "asc" } },
        _count: {
          select: {
            wins: { where: { visibility: "PUBLIC" as const } },
            battlesA: { where: { visibility: "PUBLIC" as const } },
            battlesB: { where: { visibility: "PUBLIC" as const } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 18
    })),
    timed("overview featured query", () => prisma.featuredCombo.findMany({
      where: { startsAt: { lte: now }, endsAt: { gt: now }, combo: { visibility: "PUBLIC" } },
      select: {
        id: true,
        slot: true,
        title: true,
        sponsorName: true,
        posterUrl: true,
        combo: { select: comboSelect }
      },
      orderBy: [{ slot: "asc" }, { createdAt: "desc" }],
      take: 12
    }))
  ]);

  const publicCombos = combos.map(serializeCombo);
  const comboIds = publicCombos.map((combo) => combo.id);
  const battleHistory = comboIds.length
    ? await timed("overview battle history query", () => prisma.battle.findMany({
        where: { visibility: "PUBLIC", OR: [{ comboAId: { in: comboIds } }, { comboBId: { in: comboIds } }] },
        select: { id: true, comboAId: true, comboBId: true, winnerId: true, playedAt: true },
        orderBy: { playedAt: "desc" },
        take: 720
      }))
    : [];
  const manualFeatureBySlot = new Map(activeFeatures.map((feature) => [feature.slot, feature]));
  const automaticFeatures: PublicFeature[] = [];
  for (const { slot, title } of autoSlots) {
    if (!manualFeatureBySlot.has(slot) && publicCombos.length) {
      const combo = publicCombos[periodIndex(slot, now) % publicCombos.length];
      automaticFeatures.push({ id: `auto-${slot}`, slot, title, sponsorName: null, posterUrl: null, combo });
    }
  }

  return {
    combos: publicCombos,
    decks: decks.map((deck) => ({
      id: deck.id,
      name: deck.name,
      owner: deck.owner,
      slots: deck.slots,
      winsCount: deck._count.wins,
      battlesACount: deck._count.battlesA,
      battlesBCount: deck._count.battlesB
    })),
    features: [
      ...activeFeatures.map((feature) => ({
        id: feature.id,
        slot: feature.slot,
        title: feature.title,
        sponsorName: feature.sponsorName,
        posterUrl: feature.posterUrl,
        combo: serializeCombo(feature.combo)
      })),
      ...automaticFeatures
    ],
    battleHistory: battleHistory.map(serializeBattle)
  };
}
