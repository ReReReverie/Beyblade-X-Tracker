import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ComboDetailClient } from "./combo-detail-client";
import { authOptions } from "@/lib/auth";
import { getComboViewerState, getPrivateComboDetailData, getPublicComboDetailData } from "@/lib/combo-detail-data";

export const revalidate = 300;

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicData = await getPublicComboDetailData(id);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const data = publicData ?? (userId ? await getPrivateComboDetailData(id, userId) : null);

  if (!data) notFound();

  const viewerState = await getComboViewerState(data.combo.id, userId);

  return (
    <ComboDetailClient
      data={{
        ...data,
        ...viewerState,
        isOwner: data.combo.ownerId === userId
      }}
    />
  );
}
