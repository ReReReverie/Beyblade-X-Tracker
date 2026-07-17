import { NextResponse } from "next/server";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
import { getPublicCombosOverviewData } from "@/lib/public-data";

export const revalidate = 300;

export async function GET() {
  return applyCacheHeaders(NextResponse.json(await getPublicCombosOverviewData()), publicCacheControl);
}
