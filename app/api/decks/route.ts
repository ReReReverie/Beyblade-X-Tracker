import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { deckSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const parsed = deckSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid deck data." }, { status: 400 });

    const comboIds = [parsed.data.comboOneId, parsed.data.comboTwoId, parsed.data.comboThreeId];
    if (new Set(comboIds).size !== 3) {
      return NextResponse.json({ error: "Choose three different combos." }, { status: 400 });
    }

    const combos = await prisma.combo.findMany({ where: { ownerId, id: { in: comboIds } } });
    if (combos.length !== 3) return NextResponse.json({ error: "Choose three owned combos." }, { status: 400 });

    const deck = await prisma.deck.create({
      data: {
        ownerId,
        name: parsed.data.name,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes,
        slots: {
          create: comboIds.map((comboId, index) => ({ comboId, slot: index + 1 }))
        }
      },
      include: { slots: { include: { combo: true }, orderBy: { slot: "asc" } } }
    });

    return NextResponse.json({ deck });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Deck create failed", error);
    return NextResponse.json({ error: "Could not save deck." }, { status: 500 });
  }
}
