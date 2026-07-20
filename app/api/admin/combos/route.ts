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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing combo." }, { status: 400 });

  const combo = await prisma.combo.findUnique({ where: { id }, select: { id: true } });
  if (!combo) return NextResponse.json({ error: "Combo not found." }, { status: 404 });

  await prisma.$transaction([
    prisma.comboComment.deleteMany({ where: { comboId: id } }),
    prisma.comboStar.deleteMany({ where: { comboId: id } }),
    prisma.comboPut.deleteMany({ where: { comboId: id } }),
    prisma.comboPhoto.deleteMany({ where: { comboId: id } }),
    prisma.comboPart.deleteMany({ where: { comboId: id } }),
    prisma.featuredCombo.deleteMany({ where: { comboId: id } }),
    prisma.battle.deleteMany({
      where: {
        OR: [{ comboAId: id }, { comboBId: id }, { winnerId: id }]
      }
    }),
    prisma.deckSlot.deleteMany({ where: { comboId: id } }),
    prisma.combo.delete({ where: { id } })
  ]);

  return NextResponse.json({ ok: true });
}
