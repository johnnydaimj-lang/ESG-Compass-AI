import { getAllContents } from "@/lib/esg-data";
import { getAllZones } from "@/lib/zones-store";
import { readHeatHistory, readHotspots } from "@/lib/publication-store";
import { contentTypeFromSlug, queryContents } from "@/lib/publication-query";
import HomeClient, { type InitialHomeFilters } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string; q?: string; type?: string; curated?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { month, q, type, curated } = await searchParams;
  const contents = queryContents(getAllContents());
  const zones = getAllZones();
  const hotspots = readHotspots();
  const heatHistory = readHeatHistory();
  const initialFilters: InitialHomeFilters = {
    query: (q || "").slice(0, 120),
    type: contentTypeFromSlug(type),
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : undefined,
    pickedOnly: curated === "1" || curated === "true",
  };

  return (
    <HomeClient
      contents={contents}
      zones={zones}
      initialFilters={initialFilters}
      hotspots={hotspots}
      heatHistory={heatHistory}
    />
  );
}
