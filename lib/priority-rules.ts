// 优先级判定规则：把重要性、时效、风险标签和客户压力折算成统一分数

import type { EventItem } from "./esg-data";

const IMPORTANCE_SCORE: Record<EventItem["importanceLevel"], number> = {
  高: 100,
  中: 60,
  低: 30,
};

const RECENCY_WINDOW_DAYS = 14;

function daysSince(publishedAt: string, now: Date = new Date()): number {
  const published = new Date(`${publishedAt}T00:00:00`);
  const diff = now.getTime() - published.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function isRecent(event: EventItem, windowDays = RECENCY_WINDOW_DAYS): boolean {
  return daysSince(event.publishedAt) <= windowDays;
}

export function isClientPressure(event: EventItem): boolean {
  return event.eventType === "客户/链主要求" && event.importanceLevel !== "低";
}

export function hasRiskSignal(event: EventItem): boolean {
  return event.importanceLevel === "高" || event.riskTags.length > 0;
}

export function priorityScore(event: EventItem, now: Date = new Date()): number {
  const base = IMPORTANCE_SCORE[event.importanceLevel];
  const recency = Math.max(0, RECENCY_WINDOW_DAYS - daysSince(event.publishedAt, now)) * 2;
  const riskBonus = event.riskTags.length * 8;
  const clientBonus = isClientPressure(event) ? 25 : 0;
  return base + recency + riskBonus + clientBonus;
}

export function sortByPriority(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => {
    const diff = priorityScore(b) - priorityScore(a);
    if (diff !== 0) return diff;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}
