// ESG Compass — 相关法规与标准（发布快照派生）
// 不再维护静态条目，统一从发布快照中的政策内容实时筛选。

import { getAllContents, type ContentItem } from "./esg-data";
import { getZoneKeywords, getZonesByEventId, getZonesForContent } from "./zones-store";
import { loadFilterRules } from "./filter-rules";

const rules = loadFilterRules();
const REGULATION_TYPES = new Set(rules.regulations?.contentTypes?.length ? rules.regulations.contentTypes : ["政策"]);

function contentText(item: ContentItem): string {
  return `${item.title} ${item.titleZh || ""} ${item.summary} ${item.summaryZh || ""} ${item.esgTopic} ${item.region}`.toLowerCase();
}

function isRegulation(item: ContentItem): boolean {
  return REGULATION_TYPES.has(item.contentType);
}

function sortByDateDesc(items: ContentItem[]): ContentItem[] {
  return items.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getRegulationsForZone(zoneId: string, limit = 8): ContentItem[] {
  const keywords = getZoneKeywords(zoneId);
  if (!keywords.length) return [];
  return sortByDateDesc(
    getAllContents().filter((item) =>
      isRegulation(item) && keywords.some((k) => contentText(item).includes(k.toLowerCase()))
    )
  ).slice(0, limit);
}

export function getRegulationsForEvent(item: ContentItem, limit = 8): ContentItem[] {
  const zoneMap = new Map(
    [...getZonesByEventId(item.id), ...getZonesForContent(item)].map((z) => [z.id, z])
  );
  const zoneHits = Array.from(zoneMap.values()).flatMap((zone) => getRegulationsForZone(zone.id, 50));
  const seen = new Set<string>();
  const unique: ContentItem[] = [];
  for (const candidate of zoneHits) {
    if (candidate.id === item.id || seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    unique.push(candidate);
  }
  return sortByDateDesc(unique).slice(0, limit);
}
