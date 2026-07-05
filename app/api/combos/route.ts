import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PartType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
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

    const bladeId = parsed.data.bladeId;
    const ratchetId = parsed.data.ratchetId ?? null;
    const bitId = parsed.data.bitId;
    const partIds = [bladeId, bitId, ...(ratchetId ? [ratchetId] : [])];

    const ownedParts = await prisma.part.findMany({
      where: {
        ownerId,
        id: { in: partIds }
      }
    });

    const catalogParts = await prisma.partCatalog.findMany({
      where: { id: { in: partIds } }
    });

    const partsById = new Map<string, { id: string; type: string; name: string; series: string | null; ratchetIntegration: string }>();

    for (const part of ownedParts) {
      partsById.set(part.id, {
        id: part.id,
        type: part.type,
        name: part.name,
        series: part.series,
        ratchetIntegration: part.ratchetIntegration
      });
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
            series: catalogPart.series,
            ratchetIntegration: catalogPart.ratchetIntegration,
            weightGrams: catalogPart.weightGrams ?? undefined,
            conditionRating: 5.0,
            visibility: "PUBLIC"
          }
        });
        partsById.set(catalogPart.id, {
          id: created.id,
          type: created.type,
          name: created.name,
          series: created.series,
          ratchetIntegration: created.ratchetIntegration
        });
      }
    }

    const bladePart = partsById.get(bladeId);
    const bitPart = partsById.get(bitId);
    const ratchetPart = ratchetId ? partsById.get(ratchetId) : null;

    if (!bladePart || !bitPart || (ratchetId && !ratchetPart)) {
      return NextResponse.json({ error: "Choose a blade and bit from the available catalog." }, { status: 400 });
    }

    if (bladePart.type !== "BLADE" || bitPart.type !== "BIT" || (ratchetPart && ratchetPart.type !== "RATCHET")) {
      return NextResponse.json({ error: "Choose a blade, optional ratchet, and bit from the available catalog." }, { status: 400 });
    }

    if (bladePart.ratchetIntegration === "BLADE" && bitPart.ratchetIntegration === "BIT") {
      return NextResponse.json({ error: "Choose only one ratchet-integrated part at a time." }, { status: 400 });
    }

    const duplicate = await prisma.combo.findFirst({
      where: {
        ownerId,
        bladePartId: bladePart.id,
        bitPartId: bitPart.id,
        ratchetPartId: ratchetPart?.id ?? null
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

    const comboName = ratchetPart ? `${bladePart.name} / ${ratchetPart.name} / ${bitPart.name}` : `${bladePart.name} / ${bitPart.name}`;
    const combo = await prisma.combo.create({
      data: {
        ownerId,
        name: comboName,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes,
        bladePartId: bladePart.id,
        ratchetPartId: ratchetPart?.id ?? null,
        bitPartId: bitPart.id,
        parts: {
          create: [
            { partId: bladePart.id, role: PartType.BLADE },
            ...(ratchetPart ? [{ partId: ratchetPart.id, role: PartType.RATCHET }] : []),
            { partId: bitPart.id, role: PartType.BIT }
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

  return applyCacheHeaders(NextResponse.json({ combos, page, take }), publicCacheControl);
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
