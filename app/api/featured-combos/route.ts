import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { featuredComboSchema } from "@/lib/validation";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const defaultMaxUploadMb = 1;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    const form = await request.formData();
    const poster = form.get("poster");

    const parsed = featuredComboSchema.safeParse({
      comboId: form.get("comboId"),
      slot: form.get("slot"),
      title: form.get("title"),
      sponsorName: form.get("sponsorName") || undefined,
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt")
    });
    if (!parsed.success) return NextResponse.json({ error: "Invalid featured combo data." }, { status: 400 });

    const combo = await prisma.combo.findFirst({
      where: { id: parsed.data.comboId, visibility: "PUBLIC" },
      select: { id: true }
    });
    if (!combo) return NextResponse.json({ error: "Choose a public combo." }, { status: 400 });

    let posterUrl: string | null = null;
    if (poster instanceof File && poster.size > 0) {
      const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || defaultMaxUploadMb);
      const maxBytes = maxUploadMb * 1024 * 1024;
      if (!allowed.has(poster.type) || poster.size > maxBytes) {
        return NextResponse.json({ error: `Use JPG, PNG, or WEBP images up to ${maxUploadMb} MB.` }, { status: 400 });
      }
      const upload = await uploadImage(Buffer.from(await poster.arrayBuffer()), `featured-${adminId}-${Date.now()}`);
      posterUrl = upload.secure_url;
    }

    const feature = await prisma.featuredCombo.create({
      data: {
        comboId: parsed.data.comboId,
        slot: parsed.data.slot,
        title: parsed.data.title,
        sponsorName: parsed.data.sponsorName || null,
        posterUrl,
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

export const runtime = "nodejs";
