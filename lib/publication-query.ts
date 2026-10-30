import type { ContentItem, ContentType } from "@/lib/contracts/content";

export const CONTENT_TYPE_SLUGS: Record<ContentType, string> = {
  政策: "policy",
  行业: "industry",
  观点: "opinion",
  学术: "academic",
  评级: "rating",
};

const SLUG_CONTENT_TYPES = Object.fromEntries(
  Object.entries(CONTENT_TYPE_SLUGS).map(([type, slug]) => [slug, type])
) as Record<string, ContentType>;

export interface ContentQuery {
  q?: string;
  contentType?: ContentType;
  recommended?: boolean;
  month?: string;
  updatedAfter?: string;
  excludeDrafts?: boolean;
}

export function contentTypeFromSlug(value: string | null | undefined): ContentType | undefined {
  return value ? SLUG_CONTENT_TYPES[value] : undefined;
}

export function dedupeContents(items: readonly ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function sortContentsByPublishedAt(items: readonly ContentItem[]): ContentItem[] {
  return items
    .slice()
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
}

function searchableText(item: ContentItem): string {
  return [
    item.title,
    item.titleZh,
    item.summary,
    item.summaryZh,
    item.sourceName,
    item.esgTopic,
    item.recommendReason,
    item.whyMatters,
    ...(item.pipeline?.tags || []),
    ...(item.sourceRefs || []).flatMap((source) => [source.sourceName, source.title]),
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN");
}

export function matchesContentQuery(item: ContentItem, query: ContentQuery = {}): boolean {
  if (query.excludeDrafts && item.aiDraft) return false;
  if (query.contentType && item.contentType !== query.contentType) return false;
  if (query.recommended !== undefined && Boolean(item.recommended) !== query.recommended) return false;
  if (query.month && item.publishedAt.slice(0, 7) !== query.month) return false;
  if (query.updatedAfter && item.publishedAt < query.updatedAfter) return false;

  const terms = String(query.q || "")
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return true;
  const text = searchableText(item);
  return terms.every((term) => text.includes(term));
}

export function queryContents(
  items: readonly ContentItem[],
  query: ContentQuery = {}
): ContentItem[] {
  return sortContentsByPublishedAt(
    dedupeContents(items).filter((item) => matchesContentQuery(item, query))
  );
}
