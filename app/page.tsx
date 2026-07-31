import { getAllContents } from "@/lib/esg-data";
import { getAllZones } from "@/lib/zones-store";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const contents = getAllContents();
  const sorted = [...contents].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const zones = getAllZones();
  return <HomeClient contents={sorted} zones={zones} />;
}
