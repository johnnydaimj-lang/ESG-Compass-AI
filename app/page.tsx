import { getAllContents } from "@/lib/esg-data";
import { getAllZones } from "@/lib/zones-store";
import { readHeatHistory, readHotspots } from "@/lib/publication-store";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ month?: string }> }

export default async function HomePage({ searchParams }: Props) {
  const { month } = await searchParams;
  const contents = getAllContents();
  const sorted = [...contents].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const zones = getAllZones();
  const initialMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : undefined;
  const hotspots = readHotspots();
  const heatHistory = readHeatHistory();
  return <HomeClient contents={sorted} zones={zones} initialMonth={initialMonth} hotspots={hotspots} heatHistory={heatHistory} />;
}
