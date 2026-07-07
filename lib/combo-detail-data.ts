import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const comboDetailSelect = {
  id: true,
  name: true,
  ownerId: true,
  visibility: true,
  owner: { select: { name: true, username: true } },
  parts: {
    select: {
      role: true,
      part: {
        select: {
          id: true,
          name: true,
          manufacturer: true,
          weightGrams: true,
          conditionRating: true,
          notes: true,
          photos: { where: { visibility: "PUBLIC" as const }, select: { url: true }, take: 1 }
        }
      }
    }
  },
  comments: {
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { name: true, username: true } }
    },
    orderBy: { createdAt: "desc" as const },
    take: 50
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

function serializeComboDetail(combo: any) {
  return {
    id: combo.id,
    name: combo.name,
    ownerId: combo.ownerId,
    visibility: combo.visibility,
    owner: combo.owner,
    parts: combo.parts.map((entry: any) => ({
      role: entry.role,
      part: {
        ...entry.part,
        weightGrams: entry.part.weightGrams == null ? null : Number(entry.part.weightGrams),
        conditionRating: Number(entry.part.conditionRating)
      }
    })),
    comments: combo.comments.map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString()
    })),
    starsCount: combo._count.stars,
    putsCount: combo._count.puts,
    winsCount: combo._count.wins,
    battlesACount: combo._count.battlesA,
    battlesBCount: combo._count.battlesB
  };
}

function serializeBattleDetail(battle: any) {
  return { ...battle, playedAt: battle.playedAt.toISOString() };
}

async function getComboBattleHistory(comboId: string) {
  return prisma.battle.findMany({
    where: { visibility: "PUBLIC", OR: [{ comboAId: comboId }, { comboBId: comboId }] },
    select: {
      id: true,
      comboAId: true,
      comboBId: true,
      winnerId: true,
      playedAt: true,
      comboA: { select: { name: true } },
      comboB: { select: { name: true } },
      winner: { select: { name: true } },
      comboARpm: true,
      comboBRpm: true
    },
    orderBy: { playedAt: "desc" },
    take: 120
  });
}

async function getPublicComboDetailDataUncached(id: string) {
  const combo = await prisma.combo.findFirst({
    where: { id, visibility: "PUBLIC" },
    select: comboDetailSelect
  });
  if (!combo) return null;

  const battleHistory = await getComboBattleHistory(combo.id);
  return {
    combo: serializeComboDetail(combo),
    battleHistory: battleHistory.map(serializeBattleDetail)
  };
}

export const getPublicComboDetailData = unstable_cache(
  getPublicComboDetailDataUncached,
  ["public-combo-detail-data"],
  { revalidate: 300, tags: ["public-combo-detail", "public-combos"] }
);

export async function getPrivateComboDetailData(id: string, ownerId: string) {
  const combo = await prisma.combo.findFirst({
    where: { id, ownerId },
    select: comboDetailSelect
  });
  if (!combo) return null;

  const battleHistory = await getComboBattleHistory(combo.id);
  return {
    combo: serializeComboDetail(combo),
    battleHistory: battleHistory.map(serializeBattleDetail)
  };
}

export async function getComboViewerState(comboId: string, userId: string | undefined) {
  if (!userId) {
    return { signedIn: false, initiallyStarred: false, initiallyPut: false };
  }

  const [star, put] = await Promise.all([
    prisma.comboStar.findUnique({ where: { comboId_userId: { comboId, userId } }, select: { id: true } }),
    prisma.comboPut.findUnique({ where: { comboId_userId: { comboId, userId } }, select: { id: true } })
  ]);

  return { signedIn: true, initiallyStarred: Boolean(star), initiallyPut: Boolean(put) };
}
