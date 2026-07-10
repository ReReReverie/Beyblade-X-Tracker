import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized.", status: 401 };
  if (session.user.role !== "ADMIN") return { error: "Forbidden.", status: 403 };
  return { session };
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing account." }, { status: 400 });
  if (id === admin.session.user.id) return NextResponse.json({ error: "You cannot delete your current admin account." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    const [combos, decks] = await Promise.all([
      tx.combo.findMany({ where: { ownerId: id }, select: { id: true } }),
      tx.deck.findMany({ where: { ownerId: id }, select: { id: true } })
    ]);
    const comboIds = combos.map((combo) => combo.id);
    const deckIds = decks.map((deck) => deck.id);

    await tx.battle.deleteMany({
      where: {
        OR: [
          { ownerId: id },
          { comboAId: { in: comboIds } },
          { comboBId: { in: comboIds } },
          { winnerId: { in: comboIds } },
          { deckAId: { in: deckIds } },
          { deckBId: { in: deckIds } },
          { deckWinnerId: { in: deckIds } }
        ]
      }
    });

    await tx.deckSlot.deleteMany({
      where: {
        OR: [
          { deckId: { in: deckIds } },
          { comboId: { in: comboIds } }
        ]
      }
    });

    await tx.visitorActivity.updateMany({ where: { userId: id }, data: { userId: null } });
    await tx.report.updateMany({ where: { reporterId: id }, data: { reporterId: null } });
    await tx.combo.deleteMany({ where: { ownerId: id } });
    await tx.deck.deleteMany({ where: { ownerId: id } });
    await tx.part.deleteMany({ where: { ownerId: id } });
    await tx.user.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
