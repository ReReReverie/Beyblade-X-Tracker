import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { comboActionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to put combos." }, { status: 401 });

  const parsed = comboActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid combo." }, { status: 400 });

  const combo = await prisma.combo.findFirst({ where: { id: parsed.data.comboId, visibility: "PUBLIC" }, select: { id: true } });
  if (!combo) return NextResponse.json({ error: "Combo not found." }, { status: 404 });

  const existing = await prisma.comboPut.findUnique({
    where: { comboId_userId: { comboId: combo.id, userId: session.user.id } }
  });

  if (existing) {
    await prisma.comboPut.delete({ where: { id: existing.id } });
  } else {
    await prisma.comboPut.create({ data: { comboId: combo.id, userId: session.user.id } });
  }

  const count = await prisma.comboPut.count({ where: { comboId: combo.id } });
  return NextResponse.json({ put: !existing, count });
}
