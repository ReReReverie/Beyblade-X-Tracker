import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { featuredComboSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = featuredComboSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid featured combo data." }, { status: 400 });

    const combo = await prisma.combo.findFirst({
      where: { id: parsed.data.comboId, visibility: "PUBLIC" },
      select: { id: true }
    });
    if (!combo) return NextResponse.json({ error: "Choose a public combo." }, { status: 400 });

    const feature = await prisma.featuredCombo.create({
      data: {
        comboId: parsed.data.comboId,
        slot: parsed.data.slot,
        title: parsed.data.title,
        sponsorName: parsed.data.sponsorName || null,
        posterUrl: parsed.data.posterUrl || null,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt
      }
    });

    return NextResponse.json({ feature });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
    console.error("Featured combo create failed", error);
    return NextResponse.json({ error: "Could not save featured combo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing feature id." }, { status: 400 });
    await prisma.featuredCombo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
    console.error("Featured combo delete failed", error);
    return NextResponse.json({ error: "Could not delete featured combo." }, { status: 500 });
  }
}
