import { NextResponse } from "next/server";
import { PartType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforceCatalogImportRequestSize } from "@/lib/usage";
import { catalogImportSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as PartType | null;
  const tier = searchParams.get("tier");

  const parts = await prisma.partCatalog.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(tier ? { metaTier: tier } : {})
    },
    orderBy: [{ metaTier: "asc" }, { type: "asc" }, { name: "asc" }]
  });

  return NextResponse.json({ parts });
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = catalogImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
    }

    try {
      enforceCatalogImportRequestSize(parsed.data.catalogIds.length);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid import request." }, { status: 400 });
    }

    const catalogParts = await prisma.partCatalog.findMany({
      where: { id: { in: parsed.data.catalogIds } }
    });

    if (!catalogParts.length) {
      return NextResponse.json({ error: "No catalog parts found." }, { status: 404 });
    }

    const existing = await prisma.part.findMany({
      where: {
        ownerId,
        catalogPartId: { in: catalogParts.map((part) => part.id) }
      },
      select: { catalogPartId: true }
    });
    const alreadyOwned = new Set(existing.map((part) => part.catalogPartId));

    const toImport = catalogParts.filter((part) => !alreadyOwned.has(part.id));
    const imported = await prisma.$transaction(
      toImport.map((catalogPart) =>
        prisma.part.create({
          data: {
            ownerId,
            catalogPartId: catalogPart.id,
            name: catalogPart.name,
            type: catalogPart.type,
            manufacturer: catalogPart.manufacturer,
            weightGrams: null,
            conditionRating: 10,
            visibility: "PUBLIC",
            notes: catalogPart.notes
          }
        })
      )
    );

    return NextResponse.json({
      imported: imported.length,
      skipped: catalogParts.length - imported.length,
      parts: imported
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Catalog import failed", error);
    return NextResponse.json({ error: "Could not import parts." }, { status: 500 });
  }
}
