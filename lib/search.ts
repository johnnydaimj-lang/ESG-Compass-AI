// 轻量检索：按标题、摘要、标签、地区、类型的中文/英文关键词匹配打分

import type { EventItem } from "./esg-data";

export interface SearchResult {
  event: EventItem;
  relevance: number;
  isHighRelevance: boolean;
  matchedTerms: string[];
}

const FIELD_WEIGHTS: { weight: number; pick: (e: EventItem) => string[] }[] = [
  { weight: 6, pick: (e) => [e.title] },
  { weight: 4, pick: (e) => [...e.topicTags, ...e.riskTags] },
  { weight: 3, pick: (e) => [e.eventType, e.region] },
  { weight: 2, pick: (e) => [e.summary, e.businessImpact, e.whyImportant] },
  { weight: 1, pick: (e) => [...e.suggestedOwners, ...e.actions] },
];

export const HIGH_RELEVANCE_THRESHOLD = 8;

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,，、;；/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function searchEvents(events: EventItem[], query: string): SearchResult[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const event of events) {
    let relevance = 0;
    const matchedTerms = new Set<string>();
    for (const term of terms) {
      for (const field of FIELD_WEIGHTS) {
        const haystacks = field.pick(event).map((s) => s.toLowerCase());
        if (haystacks.some((h) => h.includes(term))) {
          relevance += field.weight;
          matchedTerms.add(term);
          break;
        }
      }
    }
    if (relevance > 0) {
      results.push({
        event,
        relevance,
        isHighRelevance: relevance >= HIGH_RELEVANCE_THRESHOLD,
        matchedTerms: [...matchedTerms],
      });
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance);
}

export const SUGGESTED_QUERIES = [
  "欧盟供应链尽职调查",
  "客户 ESG 问卷审核",
  "EcoVadis 评级变化",
  "气候披露 ISSB",
];
