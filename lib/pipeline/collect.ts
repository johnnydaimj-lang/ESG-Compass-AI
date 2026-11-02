import Parser from "rss-parser";
import { load } from "cheerio";
import { existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { chromium, type Browser } from "playwright-core";
import type { RawMaterial, SourceTier } from "@/lib/contracts/pipeline";
import type { ContentItem } from "@/lib/contracts/content";
import { CONTENT_WINDOW_START } from "./config";
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
  limit?: number;
  timeoutMs?: number;
  renderWaitMs?: number;
  linkPatterns?: string[];
  followArticleMetadata?: boolean;
  maxArticleFetches?: number;
  useDefaultUserAgent?: boolean;
  preferBodyDate?: boolean;
  selectors?: {
    item?: string;
    title?: string;
    link?: string;
    date?: string;
    summary?: string;
  };
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

const MAX_FUTURE_SKEW_MS = 24 * 3_600_000;

function isCompleteCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function isPlausiblePublishedDate(value: string, now = Date.now()): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now + MAX_FUTURE_SKEW_MS;
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
  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (primaryError) {
    // 部分站点即使请求 identity 仍返回 gzip；手动解压后再交给 RSS 解析器。
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "ESG-Compass/2.0 (+https://esg-compass-ai.vercel.app)",
        Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "identity",
      },
      signal: AbortSignal.timeout(source.timeoutMs ?? 25_000),
    }).catch(() => null);
    if (!res?.ok) throw primaryError;
    const buffer = Buffer.from(await res.arrayBuffer());
    const xml = buffer[0] === 0x1f && buffer[1] === 0x8b
      ? gunzipSync(buffer).toString("utf8")
      : buffer.toString("utf8");
    feed = await parser.parseString(xml);
  }
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

const DATE_PATTERN = /(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/;
const SKIP_LINK_TEXT = /^(更多|详情|首页|上一页|下一页|末页|English|登录|注册|搜索|网站地图|联系我们|关于我们|版权声明|查看全部|View all|Read more|Learn more|Contact Us|Login|Register|Search|Careers|Privacy|Terms|Accessibility|Who We Are|Directories|Subscription|Profile|My Saved Content|Manage Subscriptions|Edit Profile|Submit RFP|Log error)$/i;
const NAV_PATH = /^\/(about|contact|login|account|privacy|terms|careers|search|sitemap|rss|feed|subscription|userprofile|accessibility|directories|who-we-are)(\/|$)/i;
const EXCLUDED_CONTENT_PATH = /\/(webinars?-and-events?|events?|webinars?)(\/|$)/i;
const EXCLUDED_CONTENT_TITLE = /^(webinar|recorded webinar|online event|upcoming event)\b/i;
const ENGLISH_MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11,
  december: 12, dec: 12,
};

export function isExcludedArticleUrl(url: string, title = ""): boolean {
  if (EXCLUDED_CONTENT_TITLE.test(title.trim())) return true;
  try {
    return EXCLUDED_CONTENT_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function cleanListingTitle(title: string, date: string | null): string {
  const monthPattern = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
  let cleaned = title.trim();
  if (date) {
    cleaned = cleaned.replace(
      new RegExp(`^.{0,180}?\\b\\d{1,2}\\s+(?:${monthPattern}),?\\s+20\\d{2}\\s+`, "i"),
      "",
    );
  }
  return cleaned
    .replace(/^Find out more:\s*/i, "")
    .replace(/\s+(?:Article|Press Release|External Press Release|UN Climate Press Release|UN Climate Speech|From the Podium)\s*$/i, "")
    .trim();
}

function matchesSourceUrl(source: SourceConfig, url: string): boolean {
  if (!source.linkPatterns?.length) return true;
  return source.linkPatterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(url);
    } catch {
      return false;
    }
  });
}

export function extractDate(text: string, now = Date.now()): string | null {
  const value = String(text || "").replace(
    /\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\./gi,
    "$1",
  );
  const dates: string[] = [];
  for (const match of value.matchAll(new RegExp(DATE_PATTERN.source, "g"))) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isCompleteCalendarDate(year, month, day)) {
      dates.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  const englishPattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(20\d{2})/gi;
  for (const match of value.matchAll(englishPattern)) {
    const month = ENGLISH_MONTHS[match[1].toLowerCase()];
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (month && isCompleteCalendarDate(year, month, day)) {
      dates.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  const dayFirstPattern = /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec),?\s+(20\d{2})\b/gi;
  for (const match of value.matchAll(dayFirstPattern)) {
    const day = Number(match[1]);
    const month = ENGLISH_MONTHS[match[2].toLowerCase()];
    const year = Number(match[3]);
    if (month && isCompleteCalendarDate(year, month, day)) {
      dates.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  const plausible = dates
    .filter((date) => isPlausiblePublishedDate(`${date}T00:00:00.000Z`, now))
    .sort()
    .at(-1);
  return plausible || null;
}

function extractDateFromUrl(url: string): string | null {
  const match = String(url || "").match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isCompleteCalendarDate(year, month, day)) {
      return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    }
  }
  const compact = String(url || "").match(/(?:^|[^\d])(20\d{2})(\d{2})(\d{2})(?:[^\d]|$)/);
  if (compact) {
    const year = Number(compact[1]);
    const month = Number(compact[2]);
    const day = Number(compact[3]);
    if (isCompleteCalendarDate(year, month, day)) {
      return `${compact[1]}-${compact[2]}-${compact[3]}`;
    }
  }
  return null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

export function extractWebpageMaterials(html: string, source: SourceConfig, allowUndated = false): RawMaterial[] {
  const $ = load(html);
  const tier = sourceTierFor(source);
  const limit = source.limit ?? 20;
  const selectors = source.selectors;
  const candidates: Array<{ title: string; href: string; date: string | null; summary: string }> = [];

  if (selectors?.item) {
    $(selectors.item).each((_, node) => {
      const $node = $(node);
      const $link = selectors.link === ":scope" ? $node : $node.find(selectors.link || "a").first();
      const $title = $node.find(selectors.title || "a,h1,h2,h3,h4").first();
      const $date = $node.find(selectors.date || "time,[datetime],.date,.time").first();
      const $summary = $node.find(selectors.summary || "p").first();
      const title = compactText($title.attr("data-title") || $title.attr("title") || $title.text() || $link.text());
      const href = $link.attr("href") || $title.attr("href") || "";
      const absolute = resolveUrl(href, source.url);
      if (!absolute.startsWith("http") || !matchesSourceUrl(source, absolute) || isExcludedArticleUrl(absolute, title)) return;
      const date = extractDate(`${$date.attr("datetime") || ""} ${$date.text()}`)
        || extractDate($node.text())
        || extractDateFromUrl(absolute);
      const summary = compactText($summary.text());
      if (title) candidates.push({ title: cleanListingTitle(title, date), href: absolute, date, summary });
    });
  }

  if (candidates.length === 0) {
    $("a").each((_, node) => {
      const $a = $(node);
      const title = compactText($a.text() || $a.parent().text());
      const href = $a.attr("href") || "";
      if (!title || title.length < 6 || title.length > 200) return;
      if (SKIP_LINK_TEXT.test(title)) return;
      if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return;
      const absolute = resolveUrl(href, source.url);
      if (!absolute.startsWith("http")) return;
      if (!matchesSourceUrl(source, absolute)) return;
      try {
        if (NAV_PATH.test(new URL(absolute).pathname)) return;
      } catch {
        return;
      }
      const contextText = `${$a.parent().text()} ${$a.parent().parent().text()}`;
      const date = extractDate(contextText) || extractDateFromUrl(absolute);
      if (isExcludedArticleUrl(absolute, title)) return;
      candidates.push({ title: cleanListingTitle(title, date), href: absolute, date, summary: "" });
    });
  }

  // 通用回退只接受带日期的链接，避免把导航栏、登录入口等当作新闻。
  const chosen = (allowUndated ? candidates : candidates.filter((candidate) => candidate.date)).slice(0, limit * 2);
  if (process.env.DEBUG_SOURCE === source.id) {
    process.stderr.write(`[collect:${source.id}] candidates=${candidates.length} dated=${candidates.filter((item) => item.date).length} allowed=${chosen.length}\n`);
  }
  const seen = new Set<string>();
  const items: RawMaterial[] = [];
  for (const candidate of chosen) {
    if (seen.has(candidate.href)) continue;
    seen.add(candidate.href);
    const publishedAt = candidate.date ? `${candidate.date}T00:00:00.000Z` : "";
    const id = `src-${stableHash(`${source.id}:${candidate.href}:${publishedAt}`)}`;
    const summary = candidate.summary || candidate.title;
    const content: ContentItem = {
      id,
      title: candidate.title,
      summary,
      contentType: source.contentType,
      region: source.region,
      publishedAt,
      importanceLevel: "中",
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl: candidate.href,
      esgTopic: "合规与监管",
    };
    items.push({
      id,
      sourceId: source.id,
      title: candidate.title,
      summary,
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl: candidate.href,
      publishedAt,
      contentType: source.contentType,
      region: source.region,
      language: source.language,
      sourceTier: tier,
      editorialSource: isEditorialSource(source),
      content,
    });
    if (items.length >= limit) break;
  }
  return items;
}

function filterByRecency(items: RawMaterial[], source: SourceConfig): RawMaterial[] {
  if (!source.recencyDays || source.recencyDays <= 0) return items;
  const cutoff = Date.now() - source.recencyDays * 24 * 3_600_000;
  return items.filter((item) => {
    const published = Date.parse(item.publishedAt);
    return Number.isFinite(published) && published >= cutoff;
  });
}

export interface ArticleMetadata {
  title: string;
  summary: string;
  publishedAt: string;
}

function jsonLdNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(jsonLdNodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Record<string, unknown>;
  return [node, ...jsonLdNodes(node["@graph"])];
}

export function extractArticleMetadata(
  html: string,
  now = Date.now(),
  preferBodyDate = false,
): ArticleMetadata {
  const $ = load(html);
  let jsonLdTitle = "";
  let jsonLdSummary = "";
  let jsonLdDate = "";
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const parsed = JSON.parse($(node).text()) as unknown;
      for (const candidate of jsonLdNodes(parsed)) {
        if (!jsonLdDate && typeof candidate.datePublished === "string") {
          jsonLdDate = candidate.datePublished;
        }
        if (!jsonLdTitle && typeof candidate.headline === "string") jsonLdTitle = candidate.headline;
        if (!jsonLdSummary && typeof candidate.description === "string") jsonLdSummary = candidate.description;
      }
    } catch {
      // 忽略站点中无效的 JSON-LD，继续使用 OpenGraph 与正文兜底。
    }
  });
  const meta = (selectors: string[]) => selectors
    .map((selector) => $(selector).attr("content") || $(selector).attr("datetime") || "")
    .find(Boolean) || "";
  const bodyDates = preferBodyDate
    ? [...html.matchAll(/(20\d{2})年(\d{1,2})月(\d{1,2})日/g)]
      .map((match) => `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`)
      .filter((date) => isPlausiblePublishedDate(`${date}T00:00:00.000Z`, now))
    : [];
  const rawDate = bodyDates.at(-1)
    || jsonLdDate
    || html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
    || html.match(/"publishDate"\s*:\s*"([^"]+)"/i)?.[1]
    || meta(['meta[property="article:published_time"]', 'meta[name="pubdate"]', 'meta[itemprop="datePublished"]'])
    || $("time[datetime]").first().attr("datetime")
    || "";
  const parsedDate = Date.parse(rawDate);
  const dateOnly = extractDate(rawDate, now);
  const hasTime = /T\d{2}:\d{2}|\b(?:\d{2}:\d{2}|GMT|UTC)\b/i.test(rawDate);
  const publishedAt = hasTime && Number.isFinite(parsedDate) && isPlausiblePublishedDate(rawDate, now)
    ? new Date(parsedDate).toISOString()
    : dateOnly ? `${dateOnly}T00:00:00.000Z` : "";
  const title = cleanSummaryText(
    jsonLdTitle
    || meta(['meta[property="og:title"]', 'meta[name="twitter:title"]'])
    || meta(['meta[name="ArticleTitle"]'])
    || $("h1").first().text()
  );
  const metaSummary = cleanSummaryText(
    jsonLdSummary
    || meta(['meta[name="description"]', 'meta[property="og:description"]'])
    || meta(['meta[name="Description"]'])
  );
  const bodySummary = cleanSummaryText(
    $(".detail-news p, main p, article p, p")
      .slice(0, 5)
      .map((_, node) => $(node).text())
      .get()
      .join(" "),
  );
  const summary = bodySummary.length > metaSummary.length ? bodySummary : metaSummary;
  return { title, summary, publishedAt };
}

async function enrichArticleMetadata(items: RawMaterial[], source: SourceConfig): Promise<RawMaterial[]> {
  const max = Math.min(source.maxArticleFetches ?? source.limit ?? 20, items.length);
  const enriched: RawMaterial[] = [];
  for (let index = 0; index < max; index += 1) {
    const item = items[index];
    try {
      const res = await fetch(item.articleUrl || "", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(source.timeoutMs ?? 25_000),
      });
      if (!res.ok) {
        if (process.env.DEBUG_SOURCE === source.id) {
          process.stderr.write(`[article:${source.id}] ${res.status} ${item.articleUrl}\n`);
        }
        continue;
      }
      const metadata = extractArticleMetadata(await res.text(), Date.now(), Boolean(source.preferBodyDate));
      if (process.env.DEBUG_SOURCE === source.id) {
        process.stderr.write(`[article:${source.id}] ${metadata.publishedAt || "no-date"} ${item.articleUrl}\n`);
      }
      if (!metadata.publishedAt || !isPlausiblePublishedDate(metadata.publishedAt)) continue;
      item.publishedAt = metadata.publishedAt;
      item.title = metadata.title || item.title;
      item.summary = metadata.summary || item.summary || item.title;
      item.content = {
        ...item.content,
        title: item.title,
        summary: item.summary,
        publishedAt: item.publishedAt,
      };
      enriched.push(item);
    } catch {
      // 单篇文章元数据失败不应影响同批其他文章。
    }
  }
  return enriched;
}

export async function collectWebpageSource(source: SourceConfig): Promise<RawMaterial[]> {
  const res = await fetch(source.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(source.timeoutMs ?? 20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = extractWebpageMaterials(await res.text(), source, Boolean(source.followArticleMetadata));
  const result = source.followArticleMetadata ? await enrichArticleMetadata(items, source) : items;
  return filterByRecency(result, source);
}

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser;
  const edge = EDGE_PATHS.find((path) => existsSync(path));
  if (!edge) throw new Error("未找到 Microsoft Edge，无法执行 browser-render");
  sharedBrowser = await chromium.launch({
    executablePath: edge,
    headless: true,
    args: ["--no-sandbox"],
  });
  return sharedBrowser;
}

export async function closeBrowserRender(): Promise<void> {
  if (!sharedBrowser) return;
  const browser = sharedBrowser;
  sharedBrowser = null;
  await browser.close().catch(() => undefined);
}

async function renderWithPlaywright(
  url: string,
  waitMs: number,
  timeoutMs: number,
  itemSelector?: string,
  useDefaultUserAgent = false,
): Promise<string> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    ...(useDefaultUserAgent
      ? {}
      : { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" }),
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(1_000);
    const consentSelectors = [
      "#onetrust-accept-btn-handler",
      "button:has-text('Accept all')",
      "button:has-text('Accept All')",
      "button:has-text('Accept')",
      "button:has-text('同意')",
      ".cookie-accept",
    ];
    for (const selector of consentSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 2_000 }).catch(() => undefined);
        break;
      }
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => undefined);
    if (itemSelector) {
      await page.waitForSelector(itemSelector, { timeout: 20_000 }).catch(() => undefined);
    }
    await page.waitForTimeout(waitMs);
    return await page.content();
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

export async function collectBrowserRenderSource(source: SourceConfig): Promise<RawMaterial[]> {
  let html = await renderWithPlaywright(
    source.url,
    source.renderWaitMs ?? 5_000,
    source.timeoutMs ?? 60_000,
    source.selectors?.item,
    source.useDefaultUserAgent,
  );
  let items = extractWebpageMaterials(html, source, Boolean(source.followArticleMetadata));
  if (items.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    html = await renderWithPlaywright(
      source.url,
      source.renderWaitMs ?? 5_000,
      source.timeoutMs ?? 60_000,
      source.selectors?.item,
      source.useDefaultUserAgent,
    );
    items = extractWebpageMaterials(html, source, Boolean(source.followArticleMetadata));
  }
  if (process.env.DEBUG_SOURCE === source.id) {
    process.stderr.write(`[render:${source.id}] html=${html.length} teaser=${html.includes("news-teaser")} date=${html.includes("info-container")} sample=${html.slice(0, 240).replace(/\s+/g, " ")}\n`);
  }
  const result = source.followArticleMetadata ? await enrichArticleMetadata(items, source) : items;
  return filterByRecency(result, source);
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

const API_ESG_TERMS = [
  "esg",
  "climate",
  "carbon",
  "emission",
  "environment",
  "biodiversity",
  "nature",
  "human rights",
  "forced labour",
  "forced labor",
  "supply chain",
  "labor rights",
  "due diligence",
  "deforestation",
  "energy transition",
  "green finance",
  "sustainable finance",
  "climate finance",
  "renewable energy",
  "circular economy",
  "pollution",
  "waste",
];

function includesEsgTerm(value: string): boolean {
  const text = value.toLowerCase();
  return API_ESG_TERMS.some((term) => text.includes(term.toLowerCase()));
}

function apiMaterial(
  source: SourceConfig,
  input: {
    id: string;
    title: string;
    summary: string;
    publishedAt: string;
    articleUrl: string;
    language?: string;
  },
): RawMaterial {
  const tier = sourceTierFor(source);
  const title = compactText(input.title);
  const summary = firstParagraph(input.summary) || title;
  const content: ContentItem = {
    id: input.id,
    title,
    summary,
    contentType: source.contentType,
    region: source.region,
    publishedAt: input.publishedAt,
    importanceLevel: "中",
    sourceName: source.name,
    sourceUrl: source.url,
    articleUrl: input.articleUrl,
    esgTopic: "合规与监管",
  };
  return {
    id: input.id,
    sourceId: source.id,
    title,
    summary,
    sourceName: source.name,
    sourceUrl: source.url,
    articleUrl: input.articleUrl,
    publishedAt: input.publishedAt,
    contentType: source.contentType,
    region: source.region,
    language: input.language || source.language,
    sourceTier: tier,
    editorialSource: isEditorialSource(source),
    content,
  };
}

function datePartsToIso(parts: unknown): string {
  if (!Array.isArray(parts) || !Array.isArray(parts[0])) return "";
  const [year, month = 1, day = 1] = parts[0].map(Number);
  if (!isCompleteCalendarDate(year, month, day)) return "";
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  abstract?: string;
  published?: { "date-parts"?: unknown };
  URL?: string;
}

export async function collectCrossrefSource(source: SourceConfig): Promise<RawMaterial[]> {
  const url = new URL(source.url);
  url.searchParams.set("query", "ESG sustainability climate environment green finance");
  url.searchParams.set("filter", `from-pub-date:${CONTENT_WINDOW_START},type:journal-article`);
  url.searchParams.set("rows", String(Math.max(source.limit ?? 30, 30)));
  url.searchParams.set("select", "DOI,title,abstract,published,URL");

  const res = await fetch(url, {
    headers: { "User-Agent": "ESG-Compass/2.0 (research aggregation)" },
    signal: AbortSignal.timeout(source.timeoutMs ?? 30_000),
  });
  if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
  const payload = await res.json() as { message?: { items?: CrossrefWork[] } };

  return (payload.message?.items || [])
    .map((work): RawMaterial | null => {
      const title = compactText(work.title?.[0]);
      const summary = cleanSummaryText(work.abstract || title);
      const publishedAt = datePartsToIso(work.published?.["date-parts"]);
      const articleUrl = compactText(work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : ""));
      if (!title || !articleUrl || !publishedAt || !isPlausiblePublishedDate(publishedAt)) return null;
      if (!includesEsgTerm(`${title} ${summary}`)) return null;
      return apiMaterial(source, {
        id: `src-${stableHash(`${source.id}:${work.DOI || articleUrl}:${publishedAt}`)}`,
        title,
        summary,
        publishedAt,
        articleUrl,
        language: "en",
      });
    })
    .filter((item): item is RawMaterial => Boolean(item))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, source.limit ?? 30);
}

interface WorldBankDocument {
  url?: string;
  title?: string | { "cdata!"?: string };
  descr?: string | { "cdata!"?: string };
  content_1000?: string | { "cdata!"?: string };
  lnchdt?: string;
  docdt?: string;
}

function cdataValue(value: string | { "cdata!"?: string } | undefined): string {
  return typeof value === "string" ? value : value?.["cdata!"] || "";
}

export async function collectWorldBankSource(source: SourceConfig): Promise<RawMaterial[]> {
  const queries = source.keywords?.length
    ? source.keywords.slice(0, 4)
    : ["2026 climate", "2026 sustainability", "2026 environment", "2026 biodiversity"];
  const documents: WorldBankDocument[] = [];
  for (const query of queries) {
    const url = new URL(source.url);
    url.searchParams.set("format", "json");
    url.searchParams.set("rows", String(Math.max((source.limit ?? 30) * 3, 100)));
    url.searchParams.set("qterm", query);
    const res = await fetch(url, { signal: AbortSignal.timeout(source.timeoutMs ?? 30_000) });
    if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);
    const payload = await res.json() as {
      documents?: Record<string, WorldBankDocument> | WorldBankDocument[];
    };
    documents.push(...(Array.isArray(payload.documents)
      ? payload.documents
      : Object.values(payload.documents || {})));
  }

  const uniqueDocuments = [...new Map(documents.map((document) => [
    `${document.url || ""}|${document.lnchdt || document.docdt || ""}`,
    document,
  ])).values()];
  return uniqueDocuments
    .map((document): RawMaterial | null => {
      const title = compactText(cdataValue(document.title));
      const summary = cleanSummaryText(cdataValue(document.content_1000) || cdataValue(document.descr) || title);
      const publishedAt = compactText(document.lnchdt || document.docdt);
      const rawUrl = compactText(document.url);
      const articleUrl = rawUrl.replace(/^http:\/\/www\.worldbank\.org/i, "https://www.worldbank.org");
      if (!title || !articleUrl || !isPlausiblePublishedDate(publishedAt)) return null;
      if (publishedAt.slice(0, 10) < CONTENT_WINDOW_START) return null;
      if (!includesEsgTerm(`${title} ${summary}`)) return null;
      return apiMaterial(source, {
        id: `src-${stableHash(`${source.id}:${articleUrl}:${publishedAt}`)}`,
        title,
        summary,
        publishedAt: new Date(publishedAt).toISOString(),
        articleUrl,
        language: "en",
      });
    })
    .filter((item): item is RawMaterial => Boolean(item))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, source.limit ?? 30);
}

interface EuPressResource {
  eventDate?: string;
  title?: string;
  leadText?: string;
  refCode?: string;
  docutype?: { code?: string };
}

export async function collectEuPressCornerSource(source: SourceConfig): Promise<RawMaterial[]> {
  const base = new URL(source.url);
  const queries = source.keywords?.length
    ? source.keywords.slice(0, 6)
    : ["climate", "sustainability", "biodiversity", "environment", "green finance", "human rights"];
  const resources: EuPressResource[] = [];
  for (const query of queries) {
    const url = new URL(base);
    url.searchParams.set("language", "en");
    url.searchParams.set("text", query);
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(source.timeoutMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`EU Press Corner HTTP ${res.status}`);
    const payload = await res.json() as { docuLanguageListResources?: EuPressResource[] };
    resources.push(...(payload.docuLanguageListResources || []));
  }

  const uniqueResources = [...new Map(resources.map((resource) => [resource.refCode, resource])).values()];
  return uniqueResources
    .map((document): RawMaterial | null => {
      const title = compactText(document.title);
      const summary = cleanSummaryText(document.leadText || title);
      const refCode = compactText(document.refCode);
      const eventDate = compactText(document.eventDate);
      if (document.docutype?.code !== "IP" || !title || !refCode || !eventDate) return null;
      if (!includesEsgTerm(`${title} ${summary}`)) return null;
      const articleUrl = `https://ec.europa.eu/commission/presscorner/detail/en/${refCode.toLowerCase().replaceAll("/", "_")}`;
      return apiMaterial(source, {
        id: `src-${stableHash(`${source.id}:${refCode}:${eventDate}`)}`,
        title,
        summary,
        publishedAt: `${eventDate}T00:00:00.000Z`,
        articleUrl,
        language: "en",
      });
    })
    .filter((item): item is RawMaterial => Boolean(item))
    .slice(0, source.limit ?? 30);
}
