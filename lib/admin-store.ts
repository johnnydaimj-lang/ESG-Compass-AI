// 运营后台内存存储：mock 阶段保存校对状态、处置动作与备注
// 注意：进程重启后数据丢失，接入 Prisma + libSQL 后由数据库承载

import type { EventItem, ReviewAction, ReviewStatus } from "./esg-data";
import { getAllEvents } from "./esg-data";

export interface AdminOverride {
  reviewStatus?: ReviewStatus;
  reviewAction?: ReviewAction | null;
  reviewNote?: string;
}

export interface AdminEventView extends EventItem {
  isOverridden: boolean;
}

const overrides = new Map<string, AdminOverride>();

export function listAdminEvents(): AdminEventView[] {
  return getAllEvents().map((event) => {
    const override = overrides.get(event.id);
    if (!override) return { ...event, isOverridden: false };
    return {
      ...event,
      reviewStatus: override.reviewStatus ?? event.reviewStatus,
      reviewAction: override.reviewAction !== undefined ? override.reviewAction : event.reviewAction,
      reviewNote: override.reviewNote ?? event.reviewNote,
      isOverridden: true,
    };
  });
}

export interface AdminUpdateInput {
  ids: string[];
  reviewStatus?: ReviewStatus;
  reviewAction?: ReviewAction | null;
  reviewNote?: string;
}

export function applyAdminUpdate(input: AdminUpdateInput): number {
  const validIds = new Set(getAllEvents().map((e) => e.id));
  let updated = 0;
  for (const id of input.ids) {
    if (!validIds.has(id)) continue;
    const existing = overrides.get(id) ?? {};
    overrides.set(id, {
      reviewStatus: input.reviewStatus ?? existing.reviewStatus,
      reviewAction: input.reviewAction !== undefined ? input.reviewAction : existing.reviewAction,
      reviewNote: input.reviewNote !== undefined ? input.reviewNote : existing.reviewNote,
    });
    updated += 1;
  }
  return updated;
}

export function adminOverview() {
  const events = listAdminEvents();
  return {
    total: events.length,
    pending: events.filter((e) => e.reviewStatus === "pending").length,
    reviewed: events.filter((e) => e.reviewStatus === "reviewed").length,
    escalated: events.filter((e) => e.reviewAction === "escalate").length,
    followUp: events.filter((e) => e.reviewAction === "follow_up").length,
  };
}
