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

  return NextResponse.json({ comment });
}
