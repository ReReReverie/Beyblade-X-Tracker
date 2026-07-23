import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const handlerAuthenticatedApiPaths = new Set([
  "/api/cron/cleanup-inactive",
  "/api/internal/rate-limit"
]);

const publicApiReadPaths = new Set([
  "/api/home",
  "/api/combos",
  "/api/combos/overview",
  "/api/parts",
  "/api/health/db"
]);

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

  // These endpoints authenticate themselves with a separate shared secret. They
  // must reach their handlers or the middleware would either recurse (rate
  // limiter) or reject a valid cron request before it can check its secret.
  if (handlerAuthenticatedApiPaths.has(pathname)) {
    return NextResponse.next();
  }

  const isAuthApi = pathname === "/api/auth" || pathname.startsWith("/api/auth/");
  const isPublicApi = isPublicApiRequest(pathname, request.method);

  if (request.method !== "GET" && !isAuthApi) {
    const originResponse = validateOrigin(request);
    if (originResponse) return originResponse;
  }

  if (anonymousRule && request.method === "POST") {
    const response = await callRateLimiter(request, anonymousRule.rule, anonymousRule.limit, anonymousRule.windowMs);
    if (response) return response;
  }

  if (!pathname.startsWith("/api/") || isAuthApi || isPublicApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
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
        "x-rate-limit-client-ip": getClientIp(request)
      }
    });

    if (response.ok) return null;

    if (response.status !== 429) {
      return NextResponse.json({ error: "Rate limiter unavailable." }, { status: 503 });
    }

    const limited = NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    for (const header of ["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]) {
      const value = response.headers.get(header);
      if (value) limited.headers.set(header, value);
    }
    return limited;
  } catch {
    return NextResponse.json({ error: "Rate limiter unavailable." }, { status: 503 });
  }
}

function isPublicApiRequest(pathname: string, method: string) {
  if (pathname === "/api/activity") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (method !== "GET") return false;
  return publicApiReadPaths.has(pathname) || /^\/api\/combos\/[^/]+$/.test(pathname);
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function validateOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();
  if (!origin && !referer) return null;

  const configuredOrigin = process.env.APP_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const requestOrigin = origin ? new URL(origin).origin : new URL(referer!).origin;
    if (requestOrigin !== new URL(configuredOrigin).origin) {
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
