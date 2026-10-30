import type { ContentItem } from "@/lib/contracts/content";
import type { StoryCluster } from "@/lib/contracts/pipeline";

const WEEKLY_ROUNDUP_PATTERN =
  /(week in review|weekly roundup|this week in esg|一周回顾|本周esg新闻|本周esg动态)/i;

const EDITORIAL_HINT_TERMS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: "争议/冲突",
    pattern: /争议|冲突|反对|质疑|抵制|投诉|诉讼|调查|指控|裁决|判决|召回|controvers|dispute|lawsuit|investigation|complaint|recall|boycott/i,
  },
  {
    label: "漂绿/误导",
    pattern: /漂绿|洗绿|误导|虚假|不实|greenwash|misleading|false claim/i,
  },
  {
    label: "监管/处罚",
    pattern: /监管|处罚|罚款|执法|禁令|诉讼|制裁|penalt|fine|enforcement|ban|sanction/i,
  },
  {
    label: "案例/主体",
    pattern: /案例|首例|试点|工厂|项目|公司|企业|集团|银行|基金|case|pilot|project|company|bank|fund/i,
  },
  {
    label: "研究/数据",
    pattern: /研究|报告|数据|调查|样本|方法|论文|report|study|survey|data|methodology/i,
  },
];

export interface ProductTopicQuery {
  days?: number;
  limit?: number;
  query?: string;
  contentTypes?: string[];
  minScore?: number;
  includeWeekly?: boolean;
  now?: Date;
}

export interface ProductTopicItem {
  id: string;
  title: string;
  titleZh?: string;
  summary: string;
  summaryZh?: string;
  contentType: string;
  esgTopic: string;
  region: string;
  importanceLevel: string;
  publishedAt: string;
  sourceName: string;
  sourceUrl: string;
  articleUrl?: string;
  score?: number;
  heat?: number;
  storyId?: string;
  storyHeat?: number;
  storyTrend?: string;
  storySourceNames: string[];
  opportunityHints: string[];
}

export interface ProductTopicResult {
  generatedAt: string;
  filters: {
    days: number;
    query: string | null;
    contentTypes: string[];
    minScore: number | null;
    includeWeekly: boolean;
  };
  totalMatches: number;
  returned: number;
  items: ProductTopicItem[];
}

function contentText(item: ContentItem): string {
  return [
    item.title,
    item.titleZh,
    item.summary,
    item.summaryZh,
    item.esgTopic,
    item.sourceName,
    item.region,
    ...(item.pipeline?.tags || []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function isWeeklyRoundup(item: ContentItem): boolean {
  return WEEKLY_ROUNDUP_PATTERN.test(contentText(item));
}

function dateValue(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesQuery(item: ContentItem, query: string | undefined): boolean {
  if (!query?.trim()) return true;
  const text = contentText(item).toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some((term) => text.includes(term));
}

function editorialHints(item: ContentItem): string[] {
  const text = contentText(item);
  return EDITORIAL_HINT_TERMS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

function dedupeKey(item: ContentItem): string {
  return item.articleUrl?.trim() || item.id;
}

export function buildProductTopicResult(
  contents: ContentItem[],
  stories: StoryCluster[],
  options: ProductTopicQuery = {},
): ProductTopicResult {
  const now = options.now || new Date();
  const days = Number.isFinite(options.days) ? Math.max(0, Number(options.days)) : 30;
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.floor(Number(options.limit))) : 40;
  const query = options.query?.trim() || undefined;
  const contentTypes = (options.contentTypes || []).filter(Boolean);
  const minScore =
    typeof options.minScore === "number" && Number.isFinite(options.minScore)
      ? options.minScore
      : undefined;
  const cutoff = days > 0 ? now.getTime() - days * 24 * 60 * 60 * 1000 : null;
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const byArticle = new Map<string, ContentItem>();

  for (const item of contents) {
    if (!item?.id || !item.title) continue;
    if (!options.includeWeekly && isWeeklyRoundup(item)) continue;
    if (contentTypes.length > 0 && !contentTypes.includes(item.contentType)) continue;
    if (!matchesQuery(item, query)) continue;
    if (
      minScore !== undefined &&
      (typeof item.pipeline?.score !== "number" || item.pipeline.score < minScore)
    ) {
      continue;
    }
    const published = dateValue(item.publishedAt);
    if (cutoff !== null && (published === null || published < cutoff)) continue;

    const key = dedupeKey(item);
    const existing = byArticle.get(key);
    if (!existing || (dateValue(item.publishedAt) || 0) > (dateValue(existing.publishedAt) || 0)) {
      byArticle.set(key, item);
    }
  }

  const items = [...byArticle.values()]
    .sort((left, right) => {
      const dateDiff = (dateValue(right.publishedAt) || 0) - (dateValue(left.publishedAt) || 0);
      if (dateDiff !== 0) return dateDiff;
      const scoreDiff = (right.pipeline?.score || 0) - (left.pipeline?.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return left.id.localeCompare(right.id);
    })
    .map((item): ProductTopicItem => {
      const story = item.pipeline?.storyId ? storyById.get(item.pipeline.storyId) : undefined;
      const sourceNames = [
        item.sourceName,
        ...(story?.sourceNames || []),
      ].filter(Boolean);
      return {
        id: item.id,
        title: item.title,
        titleZh: item.titleZh,
        summary: item.summary,
        summaryZh: item.summaryZh,
        contentType: item.contentType,
        esgTopic: item.esgTopic,
        region: item.region,
        importanceLevel: item.importanceLevel,
        publishedAt: item.publishedAt,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        articleUrl: item.articleUrl,
        score: item.pipeline?.score,
        heat: item.pipeline?.heat ?? story?.heat,
        storyId: item.pipeline?.storyId,
        storyHeat: story?.heat,
        storyTrend: story?.trend,
        storySourceNames: [...new Set(sourceNames)],
        opportunityHints: editorialHints(item),
      };
    });

  return {
    generatedAt: now.toISOString(),
    filters: {
      days,
      query: query || null,
      contentTypes,
      minScore: minScore ?? null,
      includeWeekly: options.includeWeekly === true,
    },
    totalMatches: items.length,
    returned: Math.min(items.length, limit),
    items: items.slice(0, limit),
  };
}

export function productTopicMarkdown(result: ProductTopicResult): string {
  const lines = [
    "# ESG Compass 产品选题扫描",
    "",
    `生成时间：${result.generatedAt}`,
    `筛选范围：最近 ${result.filters.days || "全部"} 天 · 返回 ${result.returned}/${result.totalMatches} 条`,
    "",
    "> 这是产品内容的只读索引，不是已经核实的公开事实。选题后必须打开原文、补充一手来源，并区分事件、指控、调查和裁决。",
    "",
  ];
  for (const [index, item] of result.items.entries()) {
    lines.push(
      `## ${index + 1}. ${item.titleZh || item.title}`,
      "",
      `- ID：\`${item.id}\``,
      `- 类型 / 议题 / 地区：${item.contentType} · ${item.esgTopic} · ${item.region}`,
      `- 发布：${item.publishedAt}`,
      `- 来源：${item.sourceName}`,
      `- 原文：${item.articleUrl || item.sourceUrl}`,
      `- 文章评分 / 热度：${item.score ?? "未评分"} / ${item.heat ?? "无"}`,
      `- 编辑线索：${item.opportunityHints.length ? item.opportunityHints.join("、") : "未命中关键词，需人工判断"}`,
      `- 摘要：${item.summaryZh || item.summary || "无摘要"}`,
      "",
    );
  }
  return lines.join("\n");
}
