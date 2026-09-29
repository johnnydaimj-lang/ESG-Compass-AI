import Parser from "rss-parser";
import type { RawMaterial, SourceTier } from "@/lib/contracts/pipeline";
import type { ContentItem } from "@/lib/contracts/content";
import { cleanSummaryText, compactText, stableHash } from "./text";

export interface SourceConfig {
  id: string;
  name: string;
  url: string;
  rssUrl?: string;
  type: string;
  contentType: ContentItem["contentType"];
  region: string;
  language?: string;
  enabled?: boolean;
  requiresEnv?: string;
  fallbacks?: unknown[];
}

export function sourceTierFor(source: SourceConfig): SourceTier {
  const type = source.type.toLowerCase();
  if (["mofcom", "eu-presscorner", "worldbank", "api"].includes(type)) return "T1";
  if (["rss", "sitemap", "markdown"].includes(type)) return "T1_5";
  if (["webpage", "browser-render", "gdelt", "mailbox"].includes(type)) return "T2";
  return "SIGNAL";
}

export function isEditorialSource(source: SourceConfig): boolean {
  return sourceTierFor(source) !== "SIGNAL";
}

function toPublishedTimestamp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? trimmed.slice(0, 10) : new Date(parsed).toISOString();
}

function firstParagraph(value: string, max = 500): string {
  const text = cleanSummaryText(value);
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"), cut.lastIndexOf("; "));
  return (boundary > max * 0.5 ? cut.slice(0, boundary + 1) : cut).trim();
}

export async function collectRssSource(source: SourceConfig): Promise<RawMaterial[]> {
  const feedUrl = source.rssUrl || source.url;
  const parser = new Parser({ timeout: 20_000 });
  const feed = await parser.parseURL(feedUrl);
  const tier = sourceTierFor(source);

  return (feed.items || []).map((item) => {
    const title = compactText(item.title);
    const summary = firstParagraph(item.content || item["content:encoded"] || item.contentSnippet || item.summary || "");
    const publishedAt = toPublishedTimestamp(compactText(item.isoDate || item.pubDate));
    const articleUrl = compactText(item.link);
    const id = `src-${stableHash(`${source.id}:${articleUrl || title}:${publishedAt}`)}`;
    const content: ContentItem = {
      id,
      title,
      summary,
      contentType: source.contentType,
      region: source.region,
      publishedAt,
      importanceLevel: "中",
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl,
      esgTopic: "合规与监管",
    };
    return {
      id,
      sourceId: source.id,
      title,
      summary,
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl,
      publishedAt,
      contentType: source.contentType,
      region: source.region,
      language: source.language,
      sourceTier: tier,
      editorialSource: isEditorialSource(source),
      content,
    };
  });
}
