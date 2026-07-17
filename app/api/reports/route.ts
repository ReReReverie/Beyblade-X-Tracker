import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ReportKind } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  kind: z.nativeEnum(ReportKind),
  title: z.string().trim().min(3).max(120),
  details: z.string().trim().min(5).max(2000),
  path: z.string().trim().max(300).optional()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report." }, { status: 400 });

  const session = await getServerSession(authOptions);
  const report = await prisma.report.create({
    data: {
      ...parsed.data,
      reporterId: session?.user?.id
    }
  });

  return NextResponse.json({ report });
}
