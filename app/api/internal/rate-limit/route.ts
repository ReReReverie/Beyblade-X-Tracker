import { NextResponse } from "next/server";
import { consumeRateLimit, getClientIpFromHeaders, hashRateLimitIdentity } from "@/lib/rate-limit";

const maximumLimit = 120;
const maximumWindowMs = 60 * 60 * 1000;

export async function POST(request: Request) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || request.headers.get("x-rate-limit-internal") !== secret) {
    return new NextResponse(null, { status: 404 });
  }

  const rule = request.headers.get("x-rate-limit-rule") || "api";
  const limit = Math.min(Math.max(Number(request.headers.get("x-rate-limit-limit") || 60), 1), maximumLimit);
  const windowMs = Math.min(Math.max(Number(request.headers.get("x-rate-limit-window-ms") || 60000), 1000), maximumWindowMs);
  const userId = request.headers.get("x-rate-limit-user-id") || "";
  const clientIp = request.headers.get("x-rate-limit-client-ip") || getClientIpFromHeaders(request.headers);

  try {
    const ipKey = `ip:${rule}:${hashRateLimitIdentity(clientIp)}`;
    const userKey = `user:${rule}:${hashRateLimitIdentity(userId)}`;
    const [ipResult, userResult] = await Promise.all([
      consumeRateLimit({ key: ipKey, limit: userId ? Math.max(limit * 2, 120) : limit, windowMs }),
      userId ? consumeRateLimit({ key: userKey, limit, windowMs }) : null
    ]);

    const denied = [ipResult, userResult].find((result) => result && !result.allowed);
    if (!denied) return NextResponse.json({ ok: true });

    const response = NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    response.headers.set("Retry-After", String(Math.max(Math.ceil((denied.resetAt.getTime() - Date.now()) / 1000), 1)));
    response.headers.set("X-RateLimit-Limit", String(denied.limit));
    response.headers.set("X-RateLimit-Remaining", String(denied.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(denied.resetAt.getTime() / 1000)));
    return response;
  } catch (error) {
    console.error("Internal rate limiter failed", error);
    return NextResponse.json({ error: "Rate limiter unavailable." }, { status: 503 });
  }
}

export const runtime = "nodejs";
