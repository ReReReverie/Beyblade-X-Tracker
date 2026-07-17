import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const inactiveCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Use a single efficient query instead of loading all active IDs into memory.
  // Delete users who: have role USER, were created before cutoff, AND have no
  // recent visitor activity (no row with lastSeen >= cutoff linked to their userId).
  const inactiveDeleted = await prisma.$executeRaw`
    DELETE FROM "User"
    WHERE "role" = 'USER'
      AND "createdAt" < ${inactiveCutoff}
      AND "id" NOT IN (
        SELECT DISTINCT "userId"
        FROM "VisitorActivity"
        WHERE "userId" IS NOT NULL
          AND "lastSeen" >= ${inactiveCutoff}
      )
  `;

  return NextResponse.json({ inactiveDeleted });
}
