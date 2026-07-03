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

    const { id, ...data } = parsed.data;

    const existing = await prisma.part.findFirst({
      where: { id, ownerId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Part not found or unauthorized." }, { status: 404 });
    }

    const updated = await prisma.part.update({
      where: { id },
      data: {
        ...data,
        notes: data.notes === null ? null : data.notes
      }
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
