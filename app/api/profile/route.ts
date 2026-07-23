import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { getProfilePayload, getProfileTabPayload, parseProfileTab, ProfileNotFoundError, serializeForClient } from "@/lib/profile-data";
import { prisma } from "@/lib/prisma";
import { careerEntrySchema, profileUpdateSchema } from "@/lib/validation";

const privateCacheControl = "private, no-store, max-age=0, must-revalidate";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return profileError("Sign in to view your profile.", 401);

  try {
    const url = new URL(request.url);
    const tab = parseProfileTab(url.searchParams.get("tab"));
    const partial = url.searchParams.get("partial") === "1";
    return profileResponse(partial ? await getProfileTabPayload(session.user.id, tab) : await getProfilePayload(session.user.id, tab, session.user.role));
  } catch (error) {
    if (error instanceof ProfileNotFoundError) return profileError("Profile not found.", 404);
    return handleProfileFailure(error, "load profile data");
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return profileError("Unauthorized.", 401);

  try {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    let name: string | undefined;
    let bio: string | undefined;
    let imageUrl: string | null | undefined;

    if (contentType.includes("multipart/form-data")) {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return profileError("Invalid profile data.", 400);
      }
      const rawName = form.get("name");
      const rawBio = form.get("bio");
      const rawImage = form.get("image");
      const parsed = profileUpdateSchema.safeParse({
        name: typeof rawName === "string" ? rawName : undefined,
        bio: typeof rawBio === "string" ? rawBio : undefined
      });
      if (!parsed.success) return profileError("Invalid profile data.", 400);

      name = parsed.data.name;
      bio = parsed.data.bio;

      if (rawImage instanceof File && rawImage.size > 0) {
        const imageType = rawImage.type.toLowerCase();
        if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(imageType)) {
          return profileError("Use a JPG, PNG, or WEBP image.", 400);
        }
        const maxBytes = 1 * 1024 * 1024; // 1 MB
        if (rawImage.size > maxBytes) {
          return profileError("Image must be under 1 MB.", 400);
        }

        const upload = await uploadImage(Buffer.from(await rawImage.arrayBuffer()), `profile-${session.user.id}-${Date.now()}`);
        imageUrl = upload.secure_url;
      }
    } else {
      const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return profileError("Invalid profile data.", 400);
      name = parsed.data.name;
      bio = parsed.data.bio;
      imageUrl = parsed.data.image === undefined ? undefined : parsed.data.image || null;
      if (typeof imageUrl === "string" && !isHttpUrl(imageUrl)) {
        return profileError("Profile image URL must use HTTP or HTTPS.", 400);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name || null;
    if (bio !== undefined) updateData.bio = bio || null;
    if (imageUrl !== undefined) updateData.image = imageUrl;
    if (!Object.keys(updateData).length) return profileError("No profile changes supplied.", 400);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, image: true, bio: true }
    });

    return profileResponse({ user: serializeForClient(user) });
  } catch (error) {
    return handleProfileFailure(error, "update profile");
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return profileError("Unauthorized.", 401);

  try {
    const parsed = careerEntrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return profileError("Invalid career entry.", 400);

    const { challongeUrl, trackedParticipantName, challongeSnapshot, ...rest } = parsed.data;
    const isChallonge = Boolean(challongeUrl);
    if (isChallonge && !isSafeSnapshot(challongeSnapshot)) {
      return profileError("Tournament snapshot is too large or invalid.", 400);
    }

    const entry = await prisma.careerEntry.create({
      data: {
        userId: session.user.id,
        ...rest,
        ...(isChallonge
          ? {
              mode: "CHALLONGE",
              challongeUrl,
              trackedParticipantName,
              challongeSnapshot: challongeSnapshot ?? undefined
            }
          : {})
      }
    });

    return profileResponse({ entry: serializeForClient(entry) });
  } catch (error) {
    return handleProfileFailure(error, "save career entry");
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return profileError("Unauthorized.", 401);

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return profileError("Missing career entry.", 400);

    const deleted = await prisma.careerEntry.deleteMany({ where: { id, userId: session.user.id } });
    if (!deleted.count) return profileError("Career entry not found.", 404);
    return profileResponse({ ok: true });
  } catch (error) {
    return handleProfileFailure(error, "delete career entry");
  }
}

function profileResponse(payload: unknown, status = 200) {
  const response = NextResponse.json(payload, { status });
  response.headers.set("Cache-Control", privateCacheControl);
  return response;
}

function profileError(error: string, status: number) {
  return profileResponse({ error }, status);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeSnapshot(value: unknown) {
  if (value === undefined) return true;
  try {
    const serialized = JSON.stringify(value);
    return serialized !== undefined && serialized.length <= 512_000;
  } catch {
    return false;
  }
}

function handleProfileFailure(error: unknown, operation: string) {
  const code = getPrismaErrorCode(error);
  if (code === "P2025") return profileError("Profile data not found.", 404);
  if (code === "P2002") return profileError("That profile data already exists.", 409);

  console.error(`Profile API: ${operation} failed`, error);
  return profileError(`Could not ${operation}.`, 500);
}

function getPrismaErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

