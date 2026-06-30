import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  visitorId: z.string().min(8).max(120),
  path: z.string().min(1).max(300)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const session = await getServerSession(authOptions);
  try {
    await prisma.visitorActivity.upsert({
      where: { visitorId: parsed.data.visitorId },
      create: {
        visitorId: parsed.data.visitorId,
        path: parsed.data.path,
        userId: session?.user?.id,
        lastSeen: new Date()
      },
      update: {
        path: parsed.data.path,
        userId: session?.user?.id,
        lastSeen: new Date()
      }
    });
  } catch (error) {
    if (isTerminatedDatabaseConnection(error)) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}

function isTerminatedDatabaseConnection(error: unknown) {
  return error instanceof Error && error.message.includes("terminating connection due to administrator command");
}
