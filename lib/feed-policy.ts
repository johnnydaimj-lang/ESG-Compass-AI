import type { ContentItem } from "@/lib/contracts/content";

// 公开时间线的质量门槛：低于该分数时，只有被 2 家以上独立信源
// 报道过的故事簇才重新进入首页和专栏，避免低分内容同时被误杀。
export const MIN_FEED_SCORE = 30;

export function storyKey(item: ContentItem): string {
  return item.pipeline?.storyId || item.id;
}

export function buildStorySourceCounts(items: readonly ContentItem[]): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const item of items) {
    const key = storyKey(item);
    if (!sets.has(key)) sets.set(key, new Set());
    if (item.sourceName) sets.get(key)!.add(item.sourceName);
  }
  const counts = new Map<string, number>();
  for (const [key, set] of sets) counts.set(key, set.size);
  return counts;
}

export function isFeedEligible(item: ContentItem, storySourceCounts: Map<string, number>): boolean {
  const score = item.pipeline?.score;
  if (typeof score !== "number") return true;
  if (score >= MIN_FEED_SCORE) return true;
  return (storySourceCounts.get(storyKey(item)) || 0) >= 2;
}

// 同一故事簇只展示一张卡片；优先精选，再优先最早发布，最后取更高分。
export function collapseByStory(items: ContentItem[]): ContentItem[] {
  const byStory = new Map<string, ContentItem>();
  for (const item of items) {
    const key = storyKey(item);
    const current = byStory.get(key);
    if (!current) {
      byStory.set(key, item);
      continue;
    }
    const itemScore = item.pipeline?.score ?? 0;
    const currentScore = current.pipeline?.score ?? 0;
    const preferItem =
      (Boolean(item.recommended) && !current.recommended) ||
      (Boolean(item.recommended) === Boolean(current.recommended) &&
        (item.publishedAt < current.publishedAt ||
          (item.publishedAt === current.publishedAt && itemScore > currentScore)));
    if (preferItem) byStory.set(key, item);
  }
  return Array.from(byStory.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
