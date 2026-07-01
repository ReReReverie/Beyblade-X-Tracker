import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const inactiveCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const activeUserIds = await prisma.visitorActivity.findMany({
    where: { userId: { not: null }, lastSeen: { gte: inactiveCutoff } },
    distinct: ["userId"],
    select: { userId: true }
  });
  const activeIds = activeUserIds.map((item) => item.userId).filter((id): id is string => Boolean(id));
  const inactiveDeleted = await prisma.user.deleteMany({
    where: {
      role: "USER",
      createdAt: { lt: inactiveCutoff },
      id: { notIn: activeIds }
    }
  });

  return NextResponse.json({ inactiveDeleted: inactiveDeleted.count });
}
