import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const userId = session.user.id;
  const [user, parts, combos, decks, battles, careerEntries, comments, stars, puts, reports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, username: true, bio: true, image: true, createdAt: true, updatedAt: true }
    }),
    prisma.part.findMany({ where: { ownerId: userId }, include: { photos: true } }),
    prisma.combo.findMany({ where: { ownerId: userId }, include: { parts: { include: { part: true } }, photos: true } }),
    prisma.deck.findMany({ where: { ownerId: userId }, include: { slots: { include: { combo: true } } } }),
    prisma.battle.findMany({
      where: { ownerId: userId },
      include: { comboA: true, comboB: true, winner: true, deckA: true, deckB: true, deckWinner: true }
    }),
    prisma.careerEntry.findMany({ where: { userId } }),
    prisma.comboComment.findMany({ where: { authorId: userId }, include: { combo: true } }),
    prisma.comboStar.findMany({ where: { userId }, include: { combo: true } }),
    prisma.comboPut.findMany({ where: { userId }, include: { combo: true } }),
    prisma.report.findMany({ where: { reporterId: userId } })
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    parts,
    combos,
    decks,
    battles,
    careerEntries,
    comments,
    stars,
    puts,
    reports
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="beyblade-x-account-export-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
