import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforceBattleCreation } from "@/lib/usage";
import { battleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = battleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid battle data." }, { status: 400 });
    }

    if (parsed.data.format === "THREE_V_THREE") {
      if (!parsed.data.deckAId || !parsed.data.deckBId || !parsed.data.deckWinnerId || parsed.data.deckAId === parsed.data.deckBId) {
        return NextResponse.json({ error: "Choose two different decks." }, { status: 400 });
      }
      if (![parsed.data.deckAId, parsed.data.deckBId].includes(parsed.data.deckWinnerId)) {
        return NextResponse.json({ error: "Winner must be deck A or deck B." }, { status: 400 });
      }

      const decks = await prisma.deck.findMany({
        where: {
          id: { in: [parsed.data.deckAId, parsed.data.deckBId] },
          OR: [{ ownerId }, { visibility: "PUBLIC" }]
        }
      });
      if (decks.length !== 2) return NextResponse.json({ error: "Choose two public or owned decks." }, { status: 400 });

      await enforceBattleCreation(ownerId);

      const battle = await prisma.battle.create({
        data: {
          ownerId,
          format: parsed.data.format,
          deckAId: parsed.data.deckAId,
          deckBId: parsed.data.deckBId,
          deckWinnerId: parsed.data.deckWinnerId,
          visibility: parsed.data.visibility,
          notes: parsed.data.notes
        }
      });
      revalidateTag("public-combo-detail");
      revalidateTag("public-combos");
      revalidateTag("public-combo-detail");
    revalidateTag("public-combos");
    return NextResponse.json({ battle });
    }

    if (!parsed.data.comboAId || !parsed.data.comboBId || !parsed.data.winnerId || parsed.data.comboAId === parsed.data.comboBId) {
      return NextResponse.json({ error: "Choose two different combos." }, { status: 400 });
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

    await enforceBattleCreation(ownerId);

    const battle = await prisma.battle.create({
      data: {
        ownerId,
        format: parsed.data.format,
        comboAId: parsed.data.comboAId,
        comboBId: parsed.data.comboBId,
        winnerId: parsed.data.winnerId,
        comboARpm: parsed.data.comboARpm,
        comboBRpm: parsed.data.comboBRpm,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes
      }
    });

    revalidateTag("public-combo-detail");
    revalidateTag("public-combos");
    return NextResponse.json({ battle });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Battle create failed", error);
    return NextResponse.json({ error: "Could not save battle." }, { status: 500 });
  }
}

