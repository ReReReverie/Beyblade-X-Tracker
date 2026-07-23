import { NextResponse } from "next/server";
import { applyCacheHeaders, privateCacheControl } from "@/lib/cache";
import { getPublicCombosOverviewData, parsePublicComboOverviewParams } from "@/lib/public-data";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const params = parsePublicComboOverviewParams({
    q: searchParams.get("q") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: searchParams.get("page") || undefined
  });
  return applyCacheHeaders(NextResponse.json(await getPublicCombosOverviewData(params)), privateCacheControl);
}
