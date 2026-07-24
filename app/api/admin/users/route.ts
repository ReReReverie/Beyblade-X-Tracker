import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1).max(100);

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized.", status: 401 } as const;
  if (session.user.role !== "ADMIN") return { error: "Forbidden.", status: 403 } as const;
  return { session } as const;
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const id = idSchema.safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "Missing account." }, { status: 400 });
  if (id.data === admin.session.user.id) {
    return NextResponse.json({ error: "You cannot delete the account you are currently using." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: id.data },
        select: { id: true, role: true }
      });
      if (!user) throw new Error("ACCOUNT_NOT_FOUND");
      if (user.role === "ADMIN") throw new Error("ADMIN_ACCOUNT_PROTECTED");

      const [combos, decks] = await Promise.all([
        transaction.combo.findMany({ where: { ownerId: id.data }, select: { id: true } }),
        transaction.deck.findMany({ where: { ownerId: id.data }, select: { id: true } })
      ]);
      const comboIds = combos.map((combo) => combo.id);
      const deckIds = decks.map((deck) => deck.id);

      // Remove records that reference the user's combos/decks before deleting
      // the owning rows because those relationships intentionally use RESTRICT.
      await transaction.battle.deleteMany({
        where: {
          OR: [
            { ownerId: id.data },
            { comboAId: { in: comboIds } },
            { comboBId: { in: comboIds } },
            { winnerId: { in: comboIds } },
            { deckAId: { in: deckIds } },
            { deckBId: { in: deckIds } },
            { deckWinnerId: { in: deckIds } }
          ]
        }
      });
      await transaction.deckSlot.deleteMany({
        where: { OR: [{ deckId: { in: deckIds } }, { comboId: { in: comboIds } }] }
      });
      await transaction.comboComment.deleteMany({
        where: { OR: [{ authorId: id.data }, { comboId: { in: comboIds } }] }
      });
      await transaction.comboStar.deleteMany({
        where: { OR: [{ userId: id.data }, { comboId: { in: comboIds } }] }
      });
      await transaction.comboPut.deleteMany({
        where: { OR: [{ userId: id.data }, { comboId: { in: comboIds } }] }
      });
      await transaction.featuredCombo.deleteMany({ where: { comboId: { in: comboIds } } });
      await transaction.comboPart.deleteMany({ where: { comboId: { in: comboIds } } });
      await transaction.comboPhoto.deleteMany({ where: { comboId: { in: comboIds } } });
      await transaction.combo.deleteMany({ where: { id: { in: comboIds } } });
      await transaction.partPhoto.deleteMany({ where: { ownerId: id.data } });
      await transaction.part.deleteMany({ where: { ownerId: id.data } });
      await transaction.deck.deleteMany({ where: { id: { in: deckIds } } });
      await transaction.visitorActivity.deleteMany({ where: { userId: id.data } });
      await transaction.user.delete({ where: { id: id.data } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ADMIN_ACCOUNT_PROTECTED") {
      return NextResponse.json({ error: "Admin accounts cannot be deleted here." }, { status: 403 });
    }

    console.error("Admin account deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete this account." }, { status: 500 });
  }
}

export const runtime = "nodejs";
