import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyCacheHeaders, publicCacheControl } from "@/lib/cache";
import { getComboViewerState, getPrivateComboDetailData, getPublicComboDetailData } from "@/lib/combo-detail-data";

export const revalidate = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicData = await getPublicComboDetailData(id);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const data = publicData ?? (userId ? await getPrivateComboDetailData(id, userId) : null);

  if (!data) {
    return NextResponse.json({ error: "Combo not found." }, { status: 404 });
  }

  const viewerState = await getComboViewerState(data.combo.id, userId);

  return applyCacheHeaders(NextResponse.json({
    ...data,
    ...viewerState,
    isOwner: data.combo.ownerId === userId
  }), publicCacheControl, publicData ? undefined : "Cookie");
}
