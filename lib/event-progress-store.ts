import { readEventProgress, readPublishedContents } from "@/lib/publication-store";
import { resolveProgress } from "@/lib/event-progress";

export function getProgressMatters() {
  return resolveProgress(readEventProgress(), readPublishedContents());
}

export function getProgressForEvent(id: string) {
  return getProgressMatters().find((matter) => matter.entries.some((entry) => entry.contentId === id));
}

export function getProgressForZone(id: string) {
  return getProgressMatters().filter((matter) => matter.zoneIds.includes(id));
}
