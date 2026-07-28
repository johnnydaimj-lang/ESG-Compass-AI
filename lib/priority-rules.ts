// 重要性判定与排序规则：把重要性、时效、风险标签折算成统一分数

import type { ContentItem } from "./esg-data";

const IMPORTANCE_SCORE: Record<ImportanceLevel, number> = {
  高: 100,
  中: 60,
  低: 30,
};

type ImportanceLevel = ContentItem["importanceLevel"];

const RECENCY_WINDOW_DAYS = 14;

function daysSince(publishedAt: string, now: Date = new Date()): number {
  const published = new Date(`${publishedAt}T00:00:00`);
  return Math.max(0, Math.floor((now.getTime() - published.getTime()) / 86_400_000));
}

export function isRecent(item: ContentItem, windowDays = RECENCY_WINDOW_DAYS): boolean {
  return daysSince(item.publishedAt) <= windowDays;
}

export function hasRiskSignal(item: ContentItem): boolean {
  return item.importanceLevel === "高" || item.riskTags.length > 0;
}

export function priorityScore(item: ContentItem, now: Date = new Date()): number {
  const base = IMPORTANCE_SCORE[item.importanceLevel];
  const recency = Math.max(0, RECENCY_WINDOW_DAYS - daysSince(item.publishedAt, now)) * 2;
  const riskBonus = item.riskTags.length * 8;
  return base + recency + riskBonus;
}

export function sortByPriority(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => {
    const diff = priorityScore(b) - priorityScore(a);
    if (diff !== 0) return diff;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

// 首页「重点分析/解读」候选池：近期内容按优先级排序
export function todayFocusContents(items: ContentItem[], limit = 6): ContentItem[] {
  return sortByPriority(items.filter((c) => isRecent(c, 30))).slice(0, limit);
}

// 首页「风险观察」候选池：高重要性或带风险标签
export function riskWatchContents(items: ContentItem[], limit = 6): ContentItem[] {
  return sortByPriority(items.filter(hasRiskSignal)).slice(0, limit);
}
