import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { battleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = battleSchema.safeParse(body);
    if (!parsed.success || parsed.data.comboAId === parsed.data.comboBId) {
      return NextResponse.json({ error: "Invalid battle data." }, { status: 400 });
    }

    if (![parsed.data.comboAId, parsed.data.comboBId].includes(parsed.data.winnerId)) {
      return NextResponse.json({ error: "Winner must be combo A or combo B." }, { status: 400 });
    }

    const combos = await prisma.combo.findMany({
      where: { ownerId, id: { in: [parsed.data.comboAId, parsed.data.comboBId] } }
    });
    if (combos.length !== 2) {
      return NextResponse.json({ error: "Choose two owned combos." }, { status: 400 });
    }

    const battle = await prisma.battle.create({
      data: { ...parsed.data, ownerId }
    });

    return NextResponse.json({ battle });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
