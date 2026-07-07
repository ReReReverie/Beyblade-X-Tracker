import { CombosClient } from "./combos-client";
import { getPublicCombosOverviewData } from "@/lib/public-data";

export const revalidate = 300;

export default async function CombosPage() {
  const data = await getPublicCombosOverviewData();
  return <CombosClient initialData={data} />;
}
