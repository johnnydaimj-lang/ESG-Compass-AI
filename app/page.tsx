import { getAllContents } from "@/lib/esg-data";
import { riskWatchContents, todayFocusContents } from "@/lib/priority-rules";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const contents = getAllContents();
  return (
    <HomeClient
      focusContents={todayFocusContents(contents)}
      watchContents={riskWatchContents(contents)}
    />
  );
}
