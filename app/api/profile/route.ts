import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { getProfilePayload, parseProfileTab } from "@/lib/profile-data";
import { prisma } from "@/lib/prisma";
import { careerEntrySchema, profileUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  const tab = parseProfileTab(new URL(request.url).searchParams.get("tab"));
  return NextResponse.json(await getProfilePayload(session.user.id, tab, session.user.role));
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";
  let name: string | undefined;
  let bio: string | undefined;
  let imageUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const rawName = form.get("name");
    const rawBio = form.get("bio");
    const rawImage = form.get("image");

    name = typeof rawName === "string" ? rawName : undefined;
    bio = typeof rawBio === "string" ? rawBio : undefined;

    if (rawImage instanceof File && rawImage.size > 0) {
      if (!rawImage.type.startsWith("image/")) {
        return NextResponse.json({ error: "Use a JPG, PNG, or WEBP image." }, { status: 400 });
      }

      const upload = await uploadImage(Buffer.from(await rawImage.arrayBuffer()), `profile-${session.user.id}-${Date.now()}`);
      imageUrl = upload.secure_url;
    }
  } else {
    const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
    name = parsed.data.name;
    bio = parsed.data.bio;
    imageUrl = parsed.data.image || undefined;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      ...(imageUrl !== undefined ? { image: imageUrl } : {}),
      bio: bio || null
    },
    select: { id: true, name: true, image: true, bio: true }
  });

  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = careerEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid career entry." }, { status: 400 });

  const entry = await prisma.careerEntry.create({
    data: { userId: session.user.id, ...parsed.data }
  });

  return NextResponse.json({ entry });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing career entry." }, { status: 400 });

  await prisma.careerEntry.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}


