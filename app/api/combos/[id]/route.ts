import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (!combo) {
    return NextResponse.json({ error: "Combo not found." }, { status: 404 });
  }

  const battleHistory = await prisma.battle.findMany({
    where: { visibility: "PUBLIC", OR: [{ comboAId: combo.id }, { comboBId: combo.id }] },
    include: {
      comboA: { select: { name: true } },
      comboB: { select: { name: true } },
      winner: { select: { name: true } }
    },
    orderBy: { playedAt: "desc" },
    take: 120
  });

  return NextResponse.json({
    combo,
    battleHistory,
    signedIn: Boolean(session?.user?.id),
    isOwner: combo.ownerId === session?.user?.id,
    initiallyStarred: combo.stars.some((star) => star.userId === session?.user?.id),
    initiallyPut: combo.puts.some((put) => put.userId === session?.user?.id)
  });
}