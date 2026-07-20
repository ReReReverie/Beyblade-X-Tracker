import { prisma } from "@/lib/prisma";

const GLOBAL_MONTHLY_LIMIT = 500;
const PERSONAL_MONTHLY_LIMIT = 5;
const GLOBAL_USER_ID = "__global__";

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Get current usage stats (for display purposes).
 * Returns both global and personal usage.
 */
export async function getChallongeUsage(userId?: string, isAdmin = false) {
  const month = startOfMonth();
  const resetsAt = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)).toISOString();

  const [globalRow, personalRow] = await Promise.all([
    prisma.challongeApiUsage.findUnique({ where: { month_userId: { month, userId: GLOBAL_USER_ID } } }),
    userId
      ? prisma.challongeApiUsage.findUnique({ where: { month_userId: { month, userId } } })
      : null
  ]);

  const globalUsed = globalRow?.count ?? 0;
  const personalUsed = personalRow?.count ?? 0;
  const personalLimit = isAdmin ? null : PERSONAL_MONTHLY_LIMIT;
  const personalRemaining = isAdmin ? null : Math.max(PERSONAL_MONTHLY_LIMIT - personalUsed, 0);

  return {
    global: {
      used: globalUsed,
      limit: GLOBAL_MONTHLY_LIMIT,
      remaining: Math.max(GLOBAL_MONTHLY_LIMIT - globalUsed, 0)
    },
    personal: {
      used: personalUsed,
      limit: personalLimit,
      remaining: personalRemaining
    },
    resetsAt
  };
}

/**
 * Attempt to consume one API request.
 * Checks global limit (500) and personal limit (5 for users, unlimited for admin).
 */
export async function consumeChallongeRequest(userId: string, isAdmin: boolean): Promise<{
  allowed: boolean;
  reason?: string;
  global: { used: number; limit: number; remaining: number };
  personal: { used: number; limit: number | null; remaining: number | null };
}> {
  const month = startOfMonth();

  // Check global usage first
  const globalRow = await prisma.challongeApiUsage.findUnique({
    where: { month_userId: { month, userId: GLOBAL_USER_ID } }
  });
  const globalUsed = globalRow?.count ?? 0;

  if (globalUsed >= GLOBAL_MONTHLY_LIMIT) {
    return {
      allowed: false,
      reason: "Global monthly API limit reached (500). No more Challonge lookups available until next month.",
      global: { used: globalUsed, limit: GLOBAL_MONTHLY_LIMIT, remaining: 0 },
      personal: { used: 0, limit: isAdmin ? null : PERSONAL_MONTHLY_LIMIT, remaining: isAdmin ? null : PERSONAL_MONTHLY_LIMIT }
    };
  }

  // Check personal usage (skip for admin)
  if (!isAdmin) {
    const personalRow = await prisma.challongeApiUsage.findUnique({
      where: { month_userId: { month, userId } }
    });
    const personalUsed = personalRow?.count ?? 0;

    if (personalUsed >= PERSONAL_MONTHLY_LIMIT) {
      return {
        allowed: false,
        reason: `Your personal monthly limit reached (${PERSONAL_MONTHLY_LIMIT}/${PERSONAL_MONTHLY_LIMIT}). Contact an admin if you need more requests.`,
        global: { used: globalUsed, limit: GLOBAL_MONTHLY_LIMIT, remaining: Math.max(GLOBAL_MONTHLY_LIMIT - globalUsed, 0) },
        personal: { used: personalUsed, limit: PERSONAL_MONTHLY_LIMIT, remaining: 0 }
      };
    }
  }

  // Increment both global and personal counters (1 API call per lookup)
  const [updatedGlobal, updatedPersonal] = await Promise.all([
    prisma.challongeApiUsage.upsert({
      where: { month_userId: { month, userId: GLOBAL_USER_ID } },
      create: { month, userId: GLOBAL_USER_ID, count: 1 },
      update: { count: { increment: 1 } }
    }),
    prisma.challongeApiUsage.upsert({
      where: { month_userId: { month, userId } },
      create: { month, userId, count: 1 },
      update: { count: { increment: 1 } }
    })
  ]);

  const personalLimit = isAdmin ? null : PERSONAL_MONTHLY_LIMIT;

  return {
    allowed: true,
    global: {
      used: updatedGlobal.count,
      limit: GLOBAL_MONTHLY_LIMIT,
      remaining: Math.max(GLOBAL_MONTHLY_LIMIT - updatedGlobal.count, 0)
    },
    personal: {
      used: updatedPersonal.count,
      limit: personalLimit,
      remaining: isAdmin ? null : Math.max(PERSONAL_MONTHLY_LIMIT - updatedPersonal.count, 0)
    }
  };
}
