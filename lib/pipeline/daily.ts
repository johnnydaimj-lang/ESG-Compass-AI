import type { ContentItem } from "@/lib/contracts/content";
import type { DailyReport, DailyReportItem, DailyReportSection, StoryCluster } from "@/lib/contracts/pipeline";

const SECTION_LABELS: Record<string, string> = {
  政策: "政策",
  行业: "行业",
  观点: "观点",
  学术: "学术",
  评级: "评级",
};

function toItem(content: ContentItem): DailyReportItem {
  return {
    id: content.id,
    title: content.titleZh || content.title,
    summary: content.summaryZh || content.summary,
    sourceName: content.sourceName,
    contentType: content.contentType,
    region: content.region,
    publishedAt: content.publishedAt,
    score: content.pipeline?.score,
  };
}

function byScoreDesc(a: ContentItem, b: ContentItem): number {
  return (b.pipeline?.score ?? 0) - (a.pipeline?.score ?? 0);
}

export function buildDailyReport(
  contents: ContentItem[],
  stories: StoryCluster[],
  generatedAt: Date,
): DailyReport {
  const dates = contents.map((item) => item.publishedAt.slice(0, 10)).sort();
  const date = dates[dates.length - 1] || "";
  const dayItems = contents.filter((item) => item.publishedAt.slice(0, 10) === date);
  const pool = dayItems.length > 0 ? dayItems : contents;

  const grouped = new Map<string, ContentItem[]>();
  for (const item of pool) {
    const label = SECTION_LABELS[item.contentType] || "其他";
    const bucket = grouped.get(label) || [];
    bucket.push(item);
    grouped.set(label, bucket);
  }

  const sections: DailyReportSection[] = [...grouped.entries()]
    .map(([label, items]) => ({
      label,
      items: items.slice().sort(byScoreDesc).map(toItem),
    }))
    .sort((a, b) => b.items.length - a.items.length);

  const highlights = pool.slice().sort(byScoreDesc).slice(0, 5).map(toItem);

  const storyClusters = stories
    .filter((story) => story.memberIds.length >= 2)
    .sort((a, b) => b.heat - a.heat || b.latestPublishedAt.localeCompare(a.latestPublishedAt))
    .slice(0, 10);

  const reportStories: DailyReportItem[] = storyClusters.map((story) => ({
    id: story.id,
    title: story.title,
    summary: story.digest || story.latest,
    sourceName: `${story.participants.length} 家独立来源`,
    contentType: "热点故事",
    region: "",
    publishedAt: story.latestPublishedAt,
  }));

  return {
    date,
    generatedAt: generatedAt.toISOString(),
    highlights,
    sections,
    stories: reportStories,
  };
}
