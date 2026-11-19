import type { ContentItem } from "@/lib/contracts/content";
import { isFeedEligible } from "@/lib/feed-policy";
import { resolvePolicyContext, type PolicyContext, type ResolvedPolicyContext } from "@/lib/policy-context";

export interface ProgressEntry {
  id: string;
  contentId: string;
  stage: string;
  change: string;
  occurredOn?: string;
}

export interface ProgressMatter {
  id: string;
  title: string;
  region: string;
  zoneIds: string[];
  selfChecks: string[];
  entries: ProgressEntry[];
  policy?: PolicyContext;
}

export interface ResolvedProgress extends Omit<ProgressMatter, "entries" | "policy"> {
  entries: (ProgressEntry & { content: ContentItem; date: string; dateLabel: string })[];
  href: string;
  policy?: ResolvedPolicyContext;
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function dateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function publicationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(date);
}

// Explicit editorial membership only. Story clusters and sourceRefs never create milestones.
export function resolveProgress(snapshot: unknown, contents: readonly ContentItem[]): ResolvedProgress[] {
  if (!snapshot || typeof snapshot !== "object" || !("version" in snapshot)
    || snapshot.version !== 1 || !("matters" in snapshot) || !Array.isArray(snapshot.matters)) return [];
  const eligible = new Map(contents.filter(isFeedEligible).map((item) => [item.id, item]));
  const seenMatters = new Set<string>();
  const result: ResolvedProgress[] = [];
  for (const raw of snapshot.matters) {
    if (!raw || !nonempty(raw.id) || seenMatters.has(raw.id) || !nonempty(raw.title)
      || !nonempty(raw.region) || !Array.isArray(raw.zoneIds) || !raw.zoneIds.every(nonempty)
      || !Array.isArray(raw.selfChecks) || !raw.selfChecks.every(nonempty) || !Array.isArray(raw.entries)) continue;
    seenMatters.add(raw.id);
    const seenIds = new Set<string>();
    const seenContents = new Set<string>();
    const seenSources = new Set<string>();
    const entries: ResolvedProgress["entries"] = [];
    for (const entry of raw.entries) {
      if (!entry || !nonempty(entry.id) || !nonempty(entry.contentId) || !nonempty(entry.stage)
        || !nonempty(entry.change) || seenIds.has(entry.id) || seenContents.has(entry.contentId)
        || (entry.occurredOn !== undefined && !dateOnly(entry.occurredOn))) continue;
      const content = eligible.get(entry.contentId);
      if (!content) continue;
      const reportedOn = publicationDate(content.publishedAt);
      const source = content.articleUrl || content.sourceUrl;
      if (!reportedOn || seenSources.has(source) || (entry.occurredOn && entry.occurredOn > reportedOn)) continue;
      seenIds.add(entry.id);
      seenContents.add(entry.contentId);
      seenSources.add(source);
      entries.push({ ...entry, content, date: entry.occurredOn || reportedOn,
        dateLabel: entry.occurredOn ? "事件日期" : "报道日期" });
    }
    entries.sort((a, b) => b.date.localeCompare(a.date) || b.content.publishedAt.localeCompare(a.content.publishedAt) || a.id.localeCompare(b.id));
    if (!entries.length) continue;
    const policy = resolvePolicyContext(raw.policy, contents);
    result.push({ id: raw.id, title: raw.title, region: raw.region, zoneIds: raw.zoneIds,
      selfChecks: raw.selfChecks, entries, href: `/events/${encodeURIComponent(entries[0].contentId)}#event-progress`, policy });
  }
  // Ambiguous membership is hidden until corrected rather than picking an arbitrary matter.
  const counts = new Map<string, number>();
  for (const matter of result) for (const entry of matter.entries) counts.set(entry.contentId, (counts.get(entry.contentId) || 0) + 1);
  return result.filter((matter) => matter.entries.every((entry) => counts.get(entry.contentId) === 1))
    .sort((a, b) => b.entries[0].date.localeCompare(a.entries[0].date) || a.id.localeCompare(b.id));
}
