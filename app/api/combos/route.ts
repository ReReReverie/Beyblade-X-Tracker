import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PartRole, PartType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { applyCacheHeaders, privateCacheControl } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforceComboCreation } from "@/lib/usage";
import { comboSchema } from "@/lib/validation";

const updateComboSchema = z.object({
  id: z.string().min(1),
  visibility: z.enum(["PUBLIC", "PRIVATE"])
});

type ComboMode = "BX_UX" | "CX" | "CX_EXPANDED";
type ResolvedPart = { id: string; type: string; role: string | null; name: string; series: string | null; ratchetIntegration: string };

const roleOrder: Record<string, number> = {
  BLADE: 0,
  LOCK_CHIP: 0,
  MAIN_BLADE: 1,
  OVER_BLADE: 1,
  METAL_BLADE: 2,
  ASSIST_BLADE: 3,
  RATCHET: 4,
  BIT: 5
};

function expectedRole(mode: ComboMode, field: string) {
  const roles: Record<ComboMode, Record<string, PartRole>> = {
    BX_UX: { bladeId: PartRole.BLADE },
    CX: { lockChipId: PartRole.LOCK_CHIP, mainBladeId: PartRole.MAIN_BLADE, assistBladeId: PartRole.ASSIST_BLADE },
    CX_EXPANDED: {
      lockChipId: PartRole.LOCK_CHIP,
      overBladeId: PartRole.OVER_BLADE,
      metalBladeId: PartRole.METAL_BLADE,
      assistBladeId: PartRole.ASSIST_BLADE
    }
  };
  return roles[mode][field];
}

function requiredFields(mode: ComboMode) {
  if (mode === "CX") return ["lockChipId", "mainBladeId", "assistBladeId"];
  if (mode === "CX_EXPANDED") return ["lockChipId", "overBladeId", "metalBladeId", "assistBladeId"];
  return ["bladeId"];
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = comboSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid combo data." }, { status: 400 });

    const mode = parsed.data.mode as ComboMode;
    const required = requiredFields(mode);
    const bladeSideIds = required.map((field) => parsed.data[field as keyof typeof parsed.data]).filter(Boolean) as string[];
    const ratchetId = parsed.data.ratchetId ?? null;
    const bitId = parsed.data.bitId;
    if (bladeSideIds.length !== required.length || !bitId) {
      return NextResponse.json({ error: "Choose all required parts before saving." }, { status: 400 });
    }

    const submittedRatchetId = ratchetId || undefined;
    const requestedIds = [...bladeSideIds, bitId, ...(submittedRatchetId ? [submittedRatchetId] : [])];
    if (new Set(requestedIds).size !== requestedIds.length) {
      return NextResponse.json({ error: "Each combo slot must use a different part." }, { status: 400 });
    }

    const ownedParts = await prisma.part.findMany({ where: { ownerId, id: { in: requestedIds } } });
    const catalogParts = await prisma.partCatalog.findMany({ where: { id: { in: requestedIds } } });
    const partsBySubmittedId = new Map<string, ResolvedPart>();

    for (const part of ownedParts) {
      partsBySubmittedId.set(part.id, {
        id: part.id,
        type: part.type,
        role: part.role,
        name: part.name,
        series: part.series,
        ratchetIntegration: part.ratchetIntegration
      });
    }

    for (const catalogPart of catalogParts) {
      if (partsBySubmittedId.has(catalogPart.id)) continue;
      const created = await prisma.part.create({
        data: {
          ownerId,
          catalogPartId: catalogPart.id,
          name: catalogPart.name,
          type: catalogPart.type,
          role: catalogPart.role,
          manufacturer: catalogPart.manufacturer,
          series: catalogPart.series,
          ratchetIntegration: catalogPart.ratchetIntegration,
          weightGrams: catalogPart.weightGrams ?? undefined,
          conditionRating: 5.0,
          visibility: "PUBLIC"
        }
      });
      partsBySubmittedId.set(catalogPart.id, {
        id: created.id,
        type: created.type,
        role: created.role,
        name: created.name,
        series: created.series,
        ratchetIntegration: created.ratchetIntegration
      });
    }

    const bitPart = partsBySubmittedId.get(bitId);
    const ratchetPart = submittedRatchetId ? partsBySubmittedId.get(submittedRatchetId) : null;
    const bladeParts = required.map((field, index) => ({ field, part: partsBySubmittedId.get(bladeSideIds[index]) }));

    if (!bitPart || bladeParts.some((entry) => !entry.part) || (submittedRatchetId && !ratchetPart)) {
      return NextResponse.json({ error: "Choose parts from the available catalog." }, { status: 400 });
    }
    if (bitPart.type !== "BIT" || (ratchetPart && ratchetPart.type !== "RATCHET")) {
      return NextResponse.json({ error: "Choose a valid bit and optional ratchet." }, { status: 400 });
    }
    if (bitPart.ratchetIntegration === "BIT" && submittedRatchetId) {
      return NextResponse.json({ error: "Turbo and Operate include the ratchet, so remove the separate ratchet." }, { status: 400 });
    }
    if (bladeParts.some((entry) => entry.part?.ratchetIntegration === "BLADE") && submittedRatchetId) {
      return NextResponse.json({ error: "The selected blade includes the ratchet, so remove the separate ratchet." }, { status: 400 });
    }

    for (const { field, part } of bladeParts) {
      const role = expectedRole(mode, field);
      if (!part || part.type !== "BLADE" || part.role !== role) {
        return NextResponse.json({ error: "Choose valid parts for the selected combo type." }, { status: 400 });
      }
    }

    const comboPartEntries = [
      ...bladeParts.map(({ part }) => ({ part: part!, role: part!.role as PartRole })),
      ...(ratchetPart ? [{ part: ratchetPart, role: PartRole.RATCHET }] : []),
      { part: bitPart, role: PartRole.BIT }
    ].sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99));

    const comboPartIds = comboPartEntries.map((entry) => entry.part.id).sort();
    const existingDuplicate = await prisma.combo.findFirst({
      where: {
        ownerId,
        bitPartId: bitPart.id,
        ratchetPartId: ratchetPart?.id ?? null,
        parts: {
          every: { partId: { in: comboPartIds } }
        }
      },
      select: { id: true, parts: { select: { partId: true } } }
    });
    const duplicate = existingDuplicate && existingDuplicate.parts.length === comboPartIds.length
      ? existingDuplicate
      : undefined;
    if (duplicate) {
      return NextResponse.json({ error: "That combo already exists for your account." }, { status: 409 });
    }

    await enforceComboCreation(ownerId);

    const comboName = comboPartEntries.map((entry) => entry.part.name).join(" / ");
    const primaryBlade = comboPartEntries[0].part;
    const combo = await prisma.combo.create({
      data: {
        ownerId,
        name: comboName,
        visibility: parsed.data.visibility,
        notes: parsed.data.notes,
        bladePartId: primaryBlade.id,
        ratchetPartId: ratchetPart?.id ?? null,
        bitPartId: bitPart.id,
        parts: { create: comboPartEntries.map((entry) => ({ partId: entry.part.id, role: entry.role })) }
      },
      include: { parts: { include: { part: true }, orderBy: { role: "asc" } } }
    });

    revalidateTag("public-combo-detail");
    revalidateTag("public-combos");
    return NextResponse.json({ combo });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && (error.message.includes("limit reached") || error.message.includes("Daily"))) {
      return NextResponse.json({ error: error.message }, { status: 429 });
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

  const updated = await prisma.combo.update({ where: { id: parsed.data.id }, data: { visibility: parsed.data.visibility } });
  revalidateTag("public-combo-detail");
  revalidateTag("public-combos");
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
      _count: {
        select: {
          wins: { where: { visibility: "PUBLIC" } },
          battlesA: { where: { visibility: "PUBLIC" } },
          battlesB: { where: { visibility: "PUBLIC" } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take
  });

  return applyCacheHeaders(NextResponse.json({ combos, page, take }), privateCacheControl);
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
  revalidateTag("public-combo-detail");
  revalidateTag("public-combos");
  return NextResponse.json({ ok: true });
}

