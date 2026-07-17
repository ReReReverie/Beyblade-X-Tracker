import { NextResponse } from "next/server";

export const publicCacheControl = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";
export const privateCacheControl = "private, no-store, max-age=0, must-revalidate";

export function applyCacheHeaders(response: NextResponse, cacheControl: string, vary?: string) {
  response.headers.set("Cache-Control", cacheControl);
  if (vary) response.headers.set("Vary", vary);
  return response;
}
