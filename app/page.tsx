import { getAllContents } from "@/lib/esg-data";
import { getAllZones } from "@/lib/zones-store";
import { readHeatHistory, readHotspots } from "@/lib/publication-store";
import { contentTypeFromSlug, queryContents } from "@/lib/publication-query";
import { isFeedEligible } from "@/lib/feed-policy";
import HomeClient, { type InitialHomeFilters } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string; q?: string; type?: string; curated?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { month, q, type, curated } = await searchParams;
  const contents = queryContents(getAllContents().filter((item) => isFeedEligible(item)));
  const zones = getAllZones();
  const eligibleIds = new Set(contents.map((item) => item.id));
  const hotspots = readHotspots().filter((story) => story.memberIds.some((id) => eligibleIds.has(id)));
  const hotspotIds = new Set(hotspots.map((story) => story.id));
  const rawHeatHistory = readHeatHistory();
  const heatHistory = rawHeatHistory
    ? {
      ...rawHeatHistory,
      stories: Object.fromEntries(
        Object.entries(rawHeatHistory.stories).filter(([storyId]) => hotspotIds.has(storyId)),
      ),
    }
    : null;
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
