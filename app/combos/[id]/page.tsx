export const dynamic = "force-dynamic";

import { ComboDetailClient } from "./combo-detail-client";

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComboDetailClient comboId={id} />;
}
