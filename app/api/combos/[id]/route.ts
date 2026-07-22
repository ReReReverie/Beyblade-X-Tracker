import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { applyCacheHeaders, privateCacheControl } from "@/lib/cache";
import { getComboViewerState, getPrivateComboDetailData, getPublicComboDetailData } from "@/lib/combo-detail-data";

export const revalidate = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicData = await getPublicComboDetailData(id);
  const auth = await getSessionUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const userId = auth.user.id;
  const data = publicData ?? (userId ? await getPrivateComboDetailData(id, userId) : null);

  if (!data) {
    return NextResponse.json({ error: "Combo not found." }, { status: 404 });
  }

  const viewerState = await getComboViewerState(data.combo.id, userId);
  const response = NextResponse.json({
    ...data,
    ...viewerState,
    isOwner: data.combo.ownerId === userId
  });

  return applyCacheHeaders(response, privateCacheControl);
}
