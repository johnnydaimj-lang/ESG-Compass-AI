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
  keywords?: string[];
  recencyDays?: number;
}

export function sourceTierFor(source: SourceConfig): SourceTier {
  const type = source.type.toLowerCase();
  if (["mofcom", "eu-presscorner", "worldbank", "api"].includes(type)) return "T1";
  if (["sec-investreport"].includes(type)) return "T1";
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
    const summary = firstParagraph(item.content || item["content:encoded"] || item.contentSnippet || item.summary || "") || title;
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
  }).filter((material) => {
    if (source.keywords && source.keywords.length > 0) {
      const text = `${material.title} ${material.summary}`.toLowerCase();
      if (!source.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) return false;
    }
    if (source.recencyDays && source.recencyDays > 0) {
      const cutoff = Date.now() - source.recencyDays * 24 * 3_600_000;
      const published = Date.parse(material.publishedAt);
      if (Number.isFinite(published) && published < cutoff) return false;
    }
    return true;
  });
}

const SEC_BASE = "https://www.sec.gov";
const SEC_ESG_TERMS = [
  "climate",
  "esg",
  "sustainab",
  "environment",
  "disclosure",
  "carbon",
  "emission",
  "greenhouse",
  "气候",
  "可持续",
  "披露",
  "排放",
  "环境",
];
const SEC_RECENCY_MONTHS = 12;

function parseSecInvestreports(html: string): Array<{ releaseNo: string; date: string; title: string; href: string }> {
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
  const out: Array<{ releaseNo: string; date: string; title: string; href: string }> = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cells.length < 3) continue;
    const first = cells[0] || "";
    const href = (first.match(/href="([^"]+)"/) || [])[1] || "";
    const releaseNo = (first.match(/>([^<]+)<\/a>/) || [])[1]?.trim() || first.replace(/<[^>]+>/g, "").trim();
    const date = (cells[1] || "").replace(/<[^>]+>/g, "").trim();
    const title = cleanSummaryText(cells[2] || "");
    if (releaseNo && href && title) out.push({ releaseNo, date, title, href });
  }
  return out;
}

function secDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.trim();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export async function collectSecInvestreports(source: SourceConfig): Promise<RawMaterial[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`SEC investreports HTTP ${res.status}`);
  const html = await res.text();
  const tier = sourceTierFor(source);
  const cutoff = Date.now() - SEC_RECENCY_MONTHS * 30 * 24 * 3_600_000;
  return parseSecInvestreports(html)
    .filter((report) => {
      const title = report.title.toLowerCase();
      const isEsg = SEC_ESG_TERMS.some((term) => title.includes(term));
      const parsed = new Date(report.date);
      const isRecent = !Number.isNaN(parsed.getTime()) && parsed.getTime() >= cutoff;
      return isEsg && isRecent;
    })
    .map((report) => {
    const pdfUrl = report.href.startsWith("http") ? report.href : `${SEC_BASE}${report.href}`;
    const publishedAt = secDate(report.date);
    const title = report.title;
    const id = `src-${stableHash(`${source.id}:${pdfUrl}:${publishedAt}`)}`;
    const content: ContentItem = {
      id,
      title,
      summary: title,
      contentType: source.contentType,
      region: source.region,
      publishedAt,
      importanceLevel: "高",
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl: pdfUrl,
      esgTopic: "合规与监管",
    };
    return {
      id,
      sourceId: source.id,
      title,
      summary: title,
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl: pdfUrl,
      publishedAt,
      contentType: source.contentType,
      region: source.region,
      language: "en",
      sourceTier: tier,
      editorialSource: isEditorialSource(source),
      content,
    };
    });
}
