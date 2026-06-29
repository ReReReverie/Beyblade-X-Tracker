import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Visibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

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

    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    const safeName = `${ownerId}-${Date.now()}-${crypto.randomUUID()}${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
    const absoluteDir = path.join(process.cwd(), uploadDir);
    const absolutePath = path.join(absoluteDir, safeName);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

    const data = {
      ownerId,
      url: `/uploads/${safeName}`,
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
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
