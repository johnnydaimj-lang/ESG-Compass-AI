import { readEventProgress, readPublishedContents } from "@/lib/publication-store";
import { resolveProgress } from "@/lib/event-progress";

export function getProgressMatters() {
  return resolveProgress(readEventProgress(), readPublishedContents());
}

export function getProgressForEvent(id: string) {
  const matches = getProgressMatters().filter((matter) => matter.entries.some((entry) => entry.contentId === id)
    || matter.policy?.insights.some((insight) => insight.contentId === id));
  return matches.length === 1 ? matches[0] : undefined;
}

export function getProgressForZone(id: string) {
  return getProgressMatters().filter((matter) => matter.zoneIds.includes(id));
}
