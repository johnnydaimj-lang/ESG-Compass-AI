import type { ContentItem } from "@/lib/contracts/content";
import {
  hasEditorialFirstPerson,
  hasMetaSummaryCommentary,
  isTitleEcho,
} from "@/lib/pipeline/summary-quality";

// 公开列表硬门槛：低分、摘要缺失或仅复述标题的内容不进入首页、知识专区、日报或公开 API。
// 多源转载只用于聚类与热度，不得绕过质量门槛。
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

export function isFeedEligible(item: ContentItem): boolean {
  const score = item.pipeline?.score;
  if (typeof score !== "number" || !Number.isFinite(score) || score < MIN_FEED_SCORE) return false;
  const title = String(item.titleZh || item.title || "").trim();
  const summary = String(item.summaryZh || item.summary || "").trim();
  return summary.length >= 20
    && !isTitleEcho(title, summary)
    && !hasEditorialFirstPerson(summary)
    && !hasMetaSummaryCommentary(summary);
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
