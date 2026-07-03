import { NextResponse } from "next/server";
import type { Visibility } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { enforceUploadCreation } from "@/lib/usage";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const defaultMaxUploadMb = 1;

export async function POST(request: Request) {
  try {
    const ownerId = await requireUserId();
    const form = await request.formData();
    const file = form.get("file");
    const targetType = String(form.get("targetType") || "");
    const targetId = String(form.get("targetId") || "");
    const visibility: Visibility = form.get("visibility") === "PRIVATE" ? "PRIVATE" : "PUBLIC";

    if (!(file instanceof File) || !targetId || !["part", "combo"].includes(targetType)) {
      return NextResponse.json({ error: "Missing upload details." }, { status: 400 });
    }

    const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || defaultMaxUploadMb);
    const maxBytes = maxUploadMb * 1024 * 1024;
    if (!allowed.has(file.type) || file.size > maxBytes) {
      return NextResponse.json({ error: `Use JPG, PNG, or WEBP images up to ${maxUploadMb} MB.` }, { status: 400 });
    }

    const ownsTarget =
      targetType === "part"
        ? await prisma.part.findFirst({ where: { id: targetId, ownerId } })
        : await prisma.combo.findFirst({ where: { id: targetId, ownerId } });

    if (!ownsTarget) {
      return NextResponse.json({ error: "Target not found." }, { status: 404 });
    }

    await enforceUploadCreation(ownerId);

    const publicId = `${ownerId}-${Date.now()}-${crypto.randomUUID()}`;
    const upload = await uploadImage(Buffer.from(await file.arrayBuffer()), publicId);

    const data = {
      ownerId,
      url: upload.secure_url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      visibility
    };

    const photo =
      targetType === "part"
        ? await prisma.partPhoto.create({ data: { ...data, partId: targetId } })
        : await prisma.comboPhoto.create({ data: { ...data, comboId: targetId } });

    return NextResponse.json({ photo });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

export const runtime = "nodejs";
