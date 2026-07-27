import { getAllEvents } from "@/lib/esg-data";
import { computeHomeMetrics, riskWatchEvents, todayFocusEvents } from "@/lib/analytics";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  const events = getAllEvents();
  const metrics = computeHomeMetrics(events);
  const focusEvents = todayFocusEvents(events, 6);
  const watchEvents = riskWatchEvents(events);

  return <HomeClient metrics={metrics} focusEvents={focusEvents} watchEvents={watchEvents} />;
}
