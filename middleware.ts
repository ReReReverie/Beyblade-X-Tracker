import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const publicApiPrefixes = [
  "/api/auth/",
  "/api/auth/signup",
  "/api/activity",
  "/api/cron/cleanup-inactive"
];

const anonymousRateRules: Record<string, { rule: string; limit: number; windowMs: number }> = {
  "/api/auth/signup": { rule: "signup", limit: 3, windowMs: 15 * 60 * 1000 },
  "/api/auth/callback/credentials": { rule: "login", limit: 10, windowMs: 15 * 60 * 1000 },
  "/api/activity": { rule: "activity", limit: 12, windowMs: 60 * 60 * 1000 }
};

const authenticatedRateRules: Record<string, { rule: string; limit: number; windowMs: number }> = {
  "/api/chat-combo": { rule: "chat", limit: 5, windowMs: 60 * 1000 },
  "/api/upload": { rule: "upload", limit: 2, windowMs: 10 * 60 * 1000 },
  "/api/profile/export": { rule: "export", limit: 2, windowMs: 60 * 60 * 1000 },
  "/api/reports": { rule: "reports", limit: 5, windowMs: 60 * 60 * 1000 },
  "/api/challonge/lookup": { rule: "challonge", limit: 3, windowMs: 60 * 1000 }
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const anonymousRule = anonymousRateRules[pathname];

  if (pathname === "/api/internal/rate-limit") {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isPublicApi = publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (request.method !== "GET" && !pathname.startsWith("/api/auth/") && pathname !== "/api/cron/cleanup-inactive") {
    const originResponse = validateOrigin(request);
    if (originResponse) return originResponse;
  }

  if (anonymousRule && request.method === "POST") {
    const response = await callRateLimiter(request, anonymousRule.rule, anonymousRule.limit, anonymousRule.windowMs);
    if (response) return response;
  }

  if (!pathname.startsWith("/api/") || isPublicApi) {
    return NextResponse.next();
  }

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateRule = authenticatedRateRules[pathname] || { rule: "api", limit: 60, windowMs: 60 * 1000 };
  const response = await callRateLimiter(request, rateRule.rule, rateRule.limit, rateRule.windowMs, token.sub);
  if (response) return response;

  return NextResponse.next();
}

async function callRateLimiter(
  request: NextRequest,
  rule: string,
  limit: number,
  windowMs: number,
  userId = ""
) {
  try {
    const response = await fetch(new URL("/api/internal/rate-limit", request.url), {
      method: "POST",
      cache: "no-store",
      headers: {
        "x-rate-limit-internal": process.env.NEXTAUTH_SECRET || "",
        "x-rate-limit-rule": rule,
        "x-rate-limit-limit": String(limit),
        "x-rate-limit-window-ms": String(windowMs),
        "x-rate-limit-user-id": userId,
        "x-rate-limit-client-ip": request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
      }
    });

    if (response.status !== 429) return null;

    const limited = NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    for (const header of ["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]) {
      const value = response.headers.get(header);
      if (value) limited.headers.set(header, value);
    }
    return limited;
  } catch {
    return null;
  }
}

function validateOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const configuredOrigin = process.env.APP_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    if (new URL(origin).origin !== new URL(configuredOrigin).origin) {
      return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  return null;
}

export const config = {
  matcher: ["/api/:path*"]
};
