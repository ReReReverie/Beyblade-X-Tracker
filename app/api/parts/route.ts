import { NextResponse } from "next/server";
import { PartType } from "@prisma/client";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforcePartCreation } from "@/lib/usage";
import { partSchema, updatePartSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = partSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid part data." }, { status: 400 });
    }

    await enforcePartCreation(ownerId);

    const part = await prisma.part.create({
      data: { ...parsed.data, ownerId }
    });

    return NextResponse.json({ part });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Part create failed", error);
    return NextResponse.json({ error: "Could not save part." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = updatePartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data." }, { status: 400 });
    }

    const { id, comboId, ...data } = parsed.data;

    const existing = await prisma.part.findFirst({
      where: { id, ownerId },
      include: { catalogPart: true, comboParts: { select: { id: true, comboId: true } } }
    });
    if (!existing) {
      return NextResponse.json({ error: "Part not found or unauthorized." }, { status: 404 });
    }

    // Resolve catalog defaults for revert-to-default logic
    const catalogWeight = existing.catalogPart?.weightGrams ?? null;
    const catalogManufacturer = existing.catalogPart?.manufacturer ?? "UNKNOWN";

    // If weightGrams is explicitly null, revert to catalog default
    const resolvedWeight = data.weightGrams === null
      ? (catalogWeight !== null ? Number(catalogWeight) : undefined)
      : data.weightGrams;

    // If manufacturer is explicitly null or UNKNOWN, revert to catalog default
    const resolvedManufacturer = (data.manufacturer === null || data.manufacturer === "UNKNOWN")
      ? catalogManufacturer
      : data.manufacturer;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (resolvedManufacturer !== undefined) updateData.manufacturer = resolvedManufacturer;
    if (resolvedWeight !== undefined) updateData.weightGrams = resolvedWeight;
    else if (data.weightGrams === null && catalogWeight === null) updateData.weightGrams = null;
    if (data.conditionRating !== undefined) updateData.conditionRating = data.conditionRating;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.notes !== undefined) updateData.notes = data.notes === null ? null : data.notes;

    // Determine if part is shared across multiple combos
    const comboCount = existing.comboParts.length;
    const isShared = comboCount > 1;

    // If part is shared and we have a comboId context, clone the part for this combo
    if (isShared && comboId) {
      // Verify the combo belongs to this user
      const combo = await prisma.combo.findFirst({
        where: { id: comboId, ownerId }
      });
      if (!combo) {
        return NextResponse.json({ error: "Combo not found or unauthorized." }, { status: 404 });
      }

      // Find the specific ComboPart entry linking this part to this combo
      const comboPart = existing.comboParts.find(cp => cp.comboId === comboId);
      if (!comboPart) {
        return NextResponse.json({ error: "Part is not in the specified combo." }, { status: 400 });
      }

      // Clone the part with the edits applied
      const clonedPart = await prisma.part.create({
        data: {
          ownerId,
          catalogPartId: existing.catalogPartId,
          name: existing.name,
          type: existing.type,
          role: existing.role,
          manufacturer: (updateData.manufacturer as any) ?? existing.manufacturer,
          series: existing.series,
          ratchetIntegration: existing.ratchetIntegration,
          weightGrams: updateData.weightGrams !== undefined ? (updateData.weightGrams as any) : (existing.weightGrams !== null ? Number(existing.weightGrams) : null),
          conditionRating: (updateData.conditionRating as any) ?? Number(existing.conditionRating),
          visibility: (updateData.visibility as any) ?? existing.visibility,
          notes: updateData.notes !== undefined ? (updateData.notes as any) : existing.notes,
        }
      });

      // Update the ComboPart to reference the new cloned part
      await prisma.comboPart.update({
        where: { id: comboPart.id },
        data: { partId: clonedPart.id }
      });

      return NextResponse.json({ part: clonedPart });
    }

    // Not shared or no comboId: update in place
    const updated = await prisma.part.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ part: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Part update failed", error);
    return NextResponse.json({ error: "Could not update part." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as PartType | null;
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const take = Math.min(Number(searchParams.get("take") || 24), 48);

  const parts = await prisma.part.findMany({
    where: {
      visibility: "PUBLIC",
      ...(type ? { type } : {})
    },
    include: { photos: { where: { visibility: "PUBLIC" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take
  });

  return applyCacheHeaders(NextResponse.json({ parts, page, take }), publicCacheControl);
}

export async function DELETE(request: Request) {
  try {
    const ownerId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing part." }, { status: 400 });

    const part = await prisma.part.findFirst({ where: { id, ownerId }, include: { comboParts: { take: 1 } } });
    if (!part) return NextResponse.json({ error: "Part not found." }, { status: 404 });
    if (part.comboParts.length) {
      return NextResponse.json({ error: "Delete combos using this part first." }, { status: 409 });
    }

    await prisma.part.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Part delete failed", error);
    return NextResponse.json({ error: "Could not delete part." }, { status: 500 });
  }
}
