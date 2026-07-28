import { getAllContents } from "@/lib/esg-data";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const contents = getAllContents();
  const sorted = [...contents].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return <HomeClient contents={sorted} />;
}
