import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  return applyCacheHeaders(NextResponse.json({
    combos: combos.map((combo) => ({
      ...combo,
      initiallyStarred: combo.stars.some((star) => star.userId === session?.user?.id)
    })),
    battleHistory
  }), publicCacheControl, "Cookie");
}