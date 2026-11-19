import type { ContentItem } from "@/lib/contracts/content";
import { isFeedEligible } from "@/lib/feed-policy";

export interface PolicyContext {
  eventIds?: string[];
  issuer: string;
  issuerHost: string;
  document: {
    title: string;
    url: string;
    kind: "法规原文" | "官方公告" | "立法声明" | "咨询文件";
    documentNumber?: string;
    publishedOn: string;
    verifiedOn: string;
    evidenceLocator: string;
  };
  insights: {
    contentId: string;
    authors: string[];
    angle: string;
    evidenceLocator: string;
    reviewedOn: string;
  }[];
}

export interface ResolvedPolicyContext extends Omit<PolicyContext, "insights"> {
  insights: (PolicyContext["insights"][number] & { content: ContentItem })[];
}

export interface PolicyRelation {
  matterId: string;
  policy: ResolvedPolicyContext;
  isInterpretation: boolean;
}

const KINDS = new Set(["法规原文", "官方公告", "立法声明", "咨询文件"]);
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string" && !!value.trim(); }
function date(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

// Preserve functional query parameters; strip only known tracking keys and fragments.
export function sourceKey(value: string): string {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return "";
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch { return ""; }
}

// Editorial verification is required; a hostname, a story cluster or sourceRefs alone is insufficient.
export function resolvePolicyContext(raw: unknown, contents: readonly ContentItem[], asOf = new Date().toISOString().slice(0, 10)): ResolvedPolicyContext | undefined {
  if (!object(raw) || !text(raw.issuer) || !text(raw.issuerHost) || !object(raw.document) || !Array.isArray(raw.insights)
    || (raw.eventIds !== undefined && (!Array.isArray(raw.eventIds) || !raw.eventIds.every(text)))) return;
  const doc = raw.document;
  if (!text(doc.title) || !text(doc.url) || !text(doc.kind) || !KINDS.has(doc.kind)
    || !date(doc.publishedOn) || !date(doc.verifiedOn) || doc.publishedOn > doc.verifiedOn || doc.verifiedOn > asOf
    || !text(doc.evidenceLocator) || (doc.documentNumber !== undefined && !text(doc.documentNumber))) return;
  const officialKey = sourceKey(doc.url);
  if (!officialKey) return;
  const url = new URL(doc.url);
  if (url.protocol !== "https:" || url.hostname !== raw.issuerHost || url.pathname === "/") return;
  const items = new Map(contents.filter(isFeedEligible).map((item) => [item.id, item]));
  const seen = new Set([officialKey]);
  const insights: ResolvedPolicyContext["insights"] = [];
  for (const insight of raw.insights) {
    if (!object(insight) || !text(insight.contentId) || !text(insight.angle) || !text(insight.evidenceLocator)
      || !Array.isArray(insight.authors) || !insight.authors.every(text)
      || !date(insight.reviewedOn) || insight.reviewedOn > asOf || insight.reviewedOn < doc.publishedOn) continue;
    const content = items.get(insight.contentId);
    if (!content || Number.isNaN(Date.parse(content.publishedAt))
      || Date.parse(content.publishedAt) > Date.parse(`${insight.reviewedOn}T23:59:59.999Z`)) continue;
    const key = sourceKey(content.articleUrl || content.sourceUrl);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    insights.push({ contentId: insight.contentId, authors: insight.authors as string[], angle: insight.angle,
      evidenceLocator: insight.evidenceLocator, reviewedOn: insight.reviewedOn, content });
  }
  return { issuer: raw.issuer, issuerHost: raw.issuerHost, eventIds: raw.eventIds as string[] | undefined,
    document: { title: doc.title, url: doc.url, kind: doc.kind as PolicyContext["document"]["kind"],
      publishedOn: doc.publishedOn, verifiedOn: doc.verifiedOn, evidenceLocator: doc.evidenceLocator,
      ...(doc.documentNumber ? { documentNumber: doc.documentNumber as string } : {}) },
    insights: insights.sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt) || a.contentId.localeCompare(b.contentId)) };
}

// A policy/interpretation relation does not require a valid progress timeline.
export function policyRelationsForEvent(snapshot: unknown, contents: readonly ContentItem[], id: string, asOf?: string): PolicyRelation[] {
  const current = contents.find((item) => item.id === id && isFeedEligible(item));
  if (!current || !object(snapshot) || snapshot.version !== 1 || !Array.isArray(snapshot.matters)) return [];
  const result: PolicyRelation[] = [];
  const seen = new Set<string>();
  for (const matter of snapshot.matters) {
    if (!object(matter) || !text(matter.id)) continue;
    const policy = resolvePolicyContext(matter.policy, contents, asOf);
    if (!policy) continue;
    const isInterpretation = policy.insights.some((insight) => insight.contentId === id);
    // Explicit eventIds override legacy milestone membership. Insight membership is independent.
    const eventIds = policy.eventIds ?? (Array.isArray(matter.entries)
      ? matter.entries.flatMap((entry) => object(entry) && text(entry.contentId) ? [entry.contentId] : []) : []);
    const key = sourceKey(policy.document.url);
    if (seen.has(key) || (!isInterpretation && !eventIds.includes(id)
      && sourceKey(current.articleUrl || current.sourceUrl) !== key)) continue;
    seen.add(key);
    result.push({ matterId: matter.id, policy, isInterpretation });
  }
  return result;
}
