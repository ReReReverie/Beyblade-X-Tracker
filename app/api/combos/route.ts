import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { comboSchema } from "@/lib/validation";

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
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
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
