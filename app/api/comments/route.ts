import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { comboCommentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  const parsed = comboCommentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Comment must be 1-1000 characters." }, { status: 400 });

  const combo = await prisma.combo.findFirst({ where: { id: parsed.data.comboId, visibility: "PUBLIC" }, select: { id: true } });
  if (!combo) return NextResponse.json({ error: "Combo not found." }, { status: 404 });

  const comment = await prisma.comboComment.create({
    data: {
      comboId: combo.id,
      authorId: session.user.id,
      body: parsed.data.body
    },
    include: { author: { select: { name: true, username: true } } }
  });

  revalidateTag("public-combo-detail");
  revalidateTag("public-combos");

  return NextResponse.json({ comment });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing comment id." }, { status: 400 });

  const comment = await prisma.comboComment.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  // Allow deletion by comment author or admin
  if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await prisma.comboComment.delete({ where: { id } });
  revalidateTag("public-combo-detail");

  return NextResponse.json({ ok: true });
}
