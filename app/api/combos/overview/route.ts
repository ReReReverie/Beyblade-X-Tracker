import { NextResponse } from "next/server";
import { applyCacheHeaders, privateCacheControl } from "@/lib/cache";
import { getPublicCombosOverviewData } from "@/lib/public-data";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET() {
  return applyCacheHeaders(NextResponse.json(await getPublicCombosOverviewData()), privateCacheControl);
}
