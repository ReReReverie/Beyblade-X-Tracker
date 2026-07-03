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

    const selectedParts = await prisma.part.findMany({
      where: {
        ownerId,
        id: { in: [parsed.data.bladeId, parsed.data.ratchetId, parsed.data.bitId] }
      }
    });

    if (selectedParts.length !== 3) {
      return NextResponse.json({ error: "Choose one owned blade, ratchet, and bit." }, { status: 400 });
    }

    const duplicateCandidates = await prisma.combo.findMany({
      where: {
        OR: [{ visibility: "PUBLIC" }, { ownerId }],
        parts: {
          some: { partId: { in: [parsed.data.bladeId, parsed.data.ratchetId, parsed.data.bitId] } }
        }
      },
      include: { parts: true },
      take: 20
    });
    const duplicate = duplicateCandidates.find((combo) => {
      const partIds = new Set(combo.parts.map((part) => part.partId));
      return (
        partIds.size === 3 &&
        partIds.has(parsed.data.bladeId) &&
        partIds.has(parsed.data.ratchetId) &&
        partIds.has(parsed.data.bitId)
      );
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "That combo already exists. Follow the existing combo and add battle results there." },
        { status: 409 }
      );
    }

    await enforceComboCreation(ownerId);

    const combo = await prisma.combo.create({
      data: {
        ownerId,
        name: parsed.data.name,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes,
        parts: {
          create: [
            { partId: parsed.data.bladeId, role: "BLADE" },
            { partId: parsed.data.ratchetId, role: "RATCHET" },
            { partId: parsed.data.bitId, role: "BIT" }
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
