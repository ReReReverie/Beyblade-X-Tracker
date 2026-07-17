import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ comboId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to star combos." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid combo." }, { status: 400 });

  const existing = await prisma.comboStar.findUnique({
    where: { comboId_userId: { comboId: parsed.data.comboId, userId: session.user.id } }
  });

  if (existing) {
    await prisma.comboStar.delete({ where: { id: existing.id } });
  } else {
    await prisma.comboStar.create({ data: { comboId: parsed.data.comboId, userId: session.user.id } });
  }

  const count = await prisma.comboStar.count({ where: { comboId: parsed.data.comboId } });
  revalidateTag("public-combo-detail");
  revalidateTag("public-combos");

  return NextResponse.json({ starred: !existing, count });
}
