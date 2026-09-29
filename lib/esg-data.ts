import type { ContentItem } from "@/lib/contracts/content";
import { readPublishedContents } from "@/lib/publication-store";

export {
  CONTENT_TYPES,
  SASB_TOPICS,
  getContentLink,
  getHomeSummary,
  getHomeTitle,
  summarizeForHome,
} from "@/lib/contracts/content";
export type {
  AcademicImpact,
  ContentItem,
  ContentType,
  ExpertImpact,
  ImpactAnalysis,
  IndustryImpact,
  ImportanceLevel,
  PolicyImpact,
  RatingImpact,
  SasbTopic,
  SourceRef,
  StructuredFact,
} from "@/lib/contracts/content";

export function loadContents(): ContentItem[] {
  try {
    return readPublishedContents();
  } catch {
    console.warn("[esg-data] 读取 publication/contents.json 失败");
    return [];
  }
}

export function getAllContents(): ContentItem[] {
  const seen = new Set<string>();
  return loadContents().filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getContentById(id: string): ContentItem | undefined {
  return getAllContents().find((item) => item.id === id);
}
