// 分析计算逻辑：首页指标、订阅摘要、本周关注等聚合统计

import type { EventItem, EventType } from "./esg-data";
import { hasRiskSignal, isClientPressure, isRecent, priorityScore, sortByPriority } from "./priority-rules";

export interface HomeMetrics {
  todayFocusCount: number;
  highPriorityCount: number;
  clientPressureCount: number;
}

export function computeHomeMetrics(events: EventItem[]): HomeMetrics {
  return {
    todayFocusCount: events.filter((e) => isRecent(e, 7)).length,
    highPriorityCount: events.filter((e) => e.importanceLevel === "高").length,
    clientPressureCount: events.filter(isClientPressure).length,
  };
}

export interface SubscriptionDigest {
  policyHotspotCount: number;
  clientPressureCount: number;
  crossDepartmentCount: number;
  byType: { type: EventType; count: number }[];
  byRegion: { region: string; count: number }[];
}

export function computeSubscriptionDigest(events: EventItem[]): SubscriptionDigest {
  const typeMap = new Map<EventType, number>();
  const regionMap = new Map<string, number>();
  for (const e of events) {
    typeMap.set(e.eventType, (typeMap.get(e.eventType) ?? 0) + 1);
    regionMap.set(e.region, (regionMap.get(e.region) ?? 0) + 1);
  }
  return {
    policyHotspotCount: events.filter((e) => e.eventType === "政策法规").length,
    clientPressureCount: events.filter(isClientPressure).length,
    crossDepartmentCount: events.filter((e) => e.suggestedOwners.length >= 2).length,
    byType: [...typeMap.entries()].map(([type, count]) => ({ type, count })),
    byRegion: [...regionMap.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export interface WeeklyAttentionItem {
  event: EventItem;
  readingAdvice: string;
}

export function computeWeeklyAttention(events: EventItem[]): WeeklyAttentionItem[] {
  const crossDepartment = events.filter((e) => e.suggestedOwners.length >= 2);
  return sortByPriority(crossDepartment).map((event) => ({
    event,
    readingAdvice: buildReadingAdvice(event),
  }));
}

function buildReadingAdvice(event: EventItem): string {
  const owners = event.suggestedOwners.join("、");
  if (event.eventType === "政策法规") {
    return `建议 ${owners} 共同研读：先核对适用门槛与时间表，再分解到内部合规清单。`;
  }
  if (event.eventType === "客户/链主要求") {
    return `建议 ${owners} 共同研读：先比对问卷与现有证据缺口，再排定整改优先级。`;
  }
  return `建议 ${owners} 共同研读：确认影响范围后归档到部门待办。`;
}

export interface InsightsOverview {
  total: number;
  byType: { label: string; count: number }[];
  byRegion: { label: string; count: number }[];
  byImportance: { label: string; count: number }[];
  riskTagCloud: { label: string; count: number }[];
}

export function computeInsights(events: EventItem[]): InsightsOverview {
  const count = <T>(items: T[], key: (item: T) => string) => {
    const map = new Map<string, number>();
    for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
    return [...map.entries()]
      .map(([label, value]) => ({ label, count: value }))
      .sort((a, b) => b.count - a.count);
  };
  const allRiskTags = events.flatMap((e) => e.riskTags);
  return {
    total: events.length,
    byType: count(events, (e) => e.eventType),
    byRegion: count(events, (e) => e.region),
    byImportance: count(events, (e) => e.importanceLevel),
    riskTagCloud: count(allRiskTags, (t) => t),
  };
}

export function riskWatchEvents(events: EventItem[]): EventItem[] {
  return sortByPriority(events.filter(hasRiskSignal)).slice(0, 6);
}

export function todayFocusEvents(events: EventItem[], limit = 3): EventItem[] {
  return sortByPriority(events.filter((e) => isRecent(e, 30))).slice(0, limit);
}

export function averagePriority(events: EventItem[]): number {
  if (events.length === 0) return 0;
  return Math.round(events.reduce((sum, e) => sum + priorityScore(e), 0) / events.length);
}
