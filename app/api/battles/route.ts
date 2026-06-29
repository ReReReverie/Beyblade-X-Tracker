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
      where: {
        id: { in: [parsed.data.comboAId, parsed.data.comboBId] },
        OR: [{ ownerId }, { visibility: "PUBLIC" }]
      }
    });
    if (combos.length !== 2) {
      return NextResponse.json({ error: "Choose two public or owned combos." }, { status: 400 });
    }

    const battle = await prisma.battle.create({
      data: { ...parsed.data, ownerId }
    });

    return NextResponse.json({ battle });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Battle create failed", error);
    return NextResponse.json({ error: "Could not save battle." }, { status: 500 });
  }
}
