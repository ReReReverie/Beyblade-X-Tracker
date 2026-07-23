import { CombosClient } from "./combos-client";
import { getPublicCombosOverviewData, parsePublicComboOverviewParams } from "@/lib/public-data";

export const revalidate = 300;

export default async function CombosPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parsePublicComboOverviewParams(await searchParams);
  const data = await getPublicCombosOverviewData(params);
  return <CombosClient initialData={data} />;
}
