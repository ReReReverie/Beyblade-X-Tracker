import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const defaultApiRateLimit = {
  limit: 60,
  windowMs: 60 * 1000
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Rate limiter unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

export function hashRateLimitIdentity(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function getClientIpFromHeaders(headers?: Headers | Record<string, unknown>) {
  const get = (name: string) => {
    if (!headers) return undefined;
    if (headers instanceof Headers) return headers.get(name) || undefined;
    const value = headers[name] ?? headers[name.toLowerCase()];
    return typeof value === "string" ? value : undefined;
  };

  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || get("x-real-ip")?.trim() || "unknown";
}

export async function consumeRateLimit({ key, limit, windowMs }: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitBucket" ("id", "key", "windowStart", "count", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${key}, ${windowStart}, 1, NOW(), NOW())
      ON CONFLICT ("key", "windowStart")
      DO UPDATE SET
        "count" = "RateLimitBucket"."count" + 1,
        "updatedAt" = NOW()
      WHERE "RateLimitBucket"."count" < ${limit}
      RETURNING "count"
    `;

    const count = rows[0]?.count;
    if (count === undefined) {
      return { allowed: false, limit, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - count, 0),
      resetAt
    };
  } catch {
    throw new RateLimitUnavailableError();
  }
}
