import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { careerEntrySchema, profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  const userId = session.user.id;
  const [user, myCombos, starredCombos, putCombos, careerEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true, image: true, bio: true }
    }),
    prisma.combo.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { take: 1, orderBy: { createdAt: "desc" } },
        stars: { where: { userId }, select: { userId: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { select: { id: true } },
        battlesA: { select: { id: true } },
        battlesB: { select: { id: true } },
        _count: { select: { stars: true, puts: true, wins: true, battlesA: true, battlesB: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { stars: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { where: { userId }, select: { userId: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } },
        _count: {
          select: {
            stars: true,
            puts: true,
            wins: { where: { visibility: "PUBLIC" } },
            battlesA: { where: { visibility: "PUBLIC" } },
            battlesB: { where: { visibility: "PUBLIC" } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { puts: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { where: { userId }, select: { userId: true } },
        puts: { where: { userId }, select: { id: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } },
        _count: {
          select: {
            stars: true,
            puts: true,
            wins: { where: { visibility: "PUBLIC" } },
            battlesA: { where: { visibility: "PUBLIC" } },
            battlesB: { where: { visibility: "PUBLIC" } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.careerEntry.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 100 })
  ]);

  return NextResponse.json({
    user: {
      id: userId,
      name: user?.name,
      username: user?.username,
      email: user?.email,
      role: user?.role || session.user.role,
      image: user?.image,
      bio: user?.bio
    },
    stats: {
      comboCount: myCombos.length,
      starsAcrossMyCombos: myCombos.reduce((total, combo) => total + combo._count.stars, 0),
      starredCount: starredCombos.length,
      putCount: putCombos.length,
      careerCount: careerEntries.length
    },
    myCombos,
    starredCombos,
    putCombos,
    careerEntries
  });
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


