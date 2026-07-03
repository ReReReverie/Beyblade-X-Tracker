import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforceComboCreation } from "@/lib/usage";
import { comboSchema } from "@/lib/validation";

const updateComboSchema = z.object({
  id: z.string().min(1),
  visibility: z.enum(["PUBLIC", "PRIVATE"])
});

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = comboSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid combo data." }, { status: 400 });
    }

    const partIds = [parsed.data.bladeId, parsed.data.ratchetId, parsed.data.bitId];

    const ownedParts = await prisma.part.findMany({
      where: {
        ownerId,
        id: { in: partIds }
      }
    });

    const catalogParts = await prisma.partCatalog.findMany({
      where: { id: { in: partIds } }
    });

    const partsById = new Map<string, { id: string; type: string; name: string }>();

    for (const part of ownedParts) {
      partsById.set(part.id, { id: part.id, type: part.type, name: part.name });
    }

    for (const catalogPart of catalogParts) {
      if (!partsById.has(catalogPart.id)) {
        const created = await prisma.part.create({
          data: {
            ownerId,
            catalogPartId: catalogPart.id,
            name: catalogPart.name,
            type: catalogPart.type,
            manufacturer: catalogPart.manufacturer,
            weightGrams: catalogPart.weightGrams ?? undefined,
            conditionRating: 5.0,
            visibility: "PUBLIC"
          }
        });
        partsById.set(catalogPart.id, { id: created.id, type: created.type, name: created.name });
      }
    }

    const resolvedPartIds = partIds.map((id) => partsById.get(id)?.id).filter(Boolean) as string[];
    if (resolvedPartIds.length !== 3) {
      return NextResponse.json({ error: "Choose one blade, one ratchet, and one bit from the available catalog." }, { status: 400 });
    }

    const duplicate = await prisma.combo.findFirst({
      where: {
        ownerId,
        AND: [
          { parts: { some: { partId: resolvedPartIds[0], role: "BLADE" } } },
          { parts: { some: { partId: resolvedPartIds[1], role: "RATCHET" } } },
          { parts: { some: { partId: resolvedPartIds[2], role: "BIT" } } }
        ]
      },
      select: { id: true }
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "That combo already exists for your account. Follow the existing combo and add battle results there." },
        { status: 409 }
      );
    }

    await enforceComboCreation(ownerId);

    const comboName = `${partsById.get(resolvedPartIds[0])!.name} / ${partsById.get(resolvedPartIds[1])!.name} / ${partsById.get(resolvedPartIds[2])!.name}`;
    const combo = await prisma.combo.create({
      data: {
        ownerId,
        name: comboName,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes,
        bladePartId: resolvedPartIds[0],
        ratchetPartId: resolvedPartIds[1],
        bitPartId: resolvedPartIds[2],
        parts: {
          create: [
            { partId: resolvedPartIds[0], role: "BLADE" },
            { partId: resolvedPartIds[1], role: "RATCHET" },
            { partId: resolvedPartIds[2], role: "BIT" }
          ]
        }
      },
      include: { parts: { include: { part: true } } }
    });

    return NextResponse.json({ combo });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Combo create failed", error);
    return NextResponse.json({ error: "Could not save combo." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = updateComboSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid combo update." }, { status: 400 });

  const combo = await prisma.combo.findFirst({ where: { id: parsed.data.id, ownerId: session.user.id } });
  if (!combo) return NextResponse.json({ error: "Combo not found." }, { status: 404 });

  const updated = await prisma.combo.update({
    where: { id: parsed.data.id },
    data: { visibility: parsed.data.visibility }
  });

  return NextResponse.json({ combo: updated });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const take = Math.min(Number(searchParams.get("take") || 18), 36);

  const combos = await prisma.combo.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      parts: { include: { part: true }, orderBy: { role: "asc" } },
      photos: { where: { visibility: "PUBLIC" }, take: 1 },
      wins: { select: { id: true } },
      battlesA: { select: { id: true } },
      battlesB: { select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take
  });

  return NextResponse.json({ combos, page, take });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing combo." }, { status: 400 });

  const combo = await prisma.combo.findFirst({
    where: { id, ownerId: session.user.id },
    include: { battlesA: { take: 1 }, battlesB: { take: 1 }, wins: { take: 1 }, deckSlots: { take: 1 } }
  });
  if (!combo) return NextResponse.json({ error: "Combo not found." }, { status: 404 });
  if (combo.battlesA.length || combo.battlesB.length || combo.wins.length || combo.deckSlots.length) {
    return NextResponse.json({ error: "Delete battles or decks using this combo first." }, { status: 409 });
  }

  await prisma.combo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
