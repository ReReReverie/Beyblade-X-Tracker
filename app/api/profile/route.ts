import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  const userId = session.user.id;
  const [user, myCombos, starredCombos, putCombos] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true }
    }),
    prisma.combo.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { take: 1, orderBy: { createdAt: "desc" } },
        stars: { select: { id: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { select: { id: true } },
        battlesA: { select: { id: true } },
        battlesB: { select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { stars: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { select: { id: true, userId: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { puts: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { select: { id: true, userId: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    })
  ]);

  return NextResponse.json({
    user: {
      id: userId,
      name: user?.name,
      username: user?.username,
      email: user?.email,
      role: user?.role || session.user.role
    },
    stats: {
      comboCount: myCombos.length,
      starsAcrossMyCombos: myCombos.reduce((total, combo) => total + combo.stars.length, 0),
      starredCount: starredCombos.length,
      putCount: putCombos.length
    },
    myCombos,
    starredCombos,
    putCombos
  });
}
