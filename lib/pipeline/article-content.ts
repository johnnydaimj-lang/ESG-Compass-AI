import { existsSync } from "node:fs";

import { load } from "cheerio";
import { chromium, type Browser } from "playwright-core";

import { cleanSummaryText } from "./text";

const MAX_ARTICLE_CHARS = 8_000;
const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

let sharedBrowser: Browser | null = null;

function truncateArticle(value: string): string {
  const text = cleanSummaryText(value);
  if (text.length <= MAX_ARTICLE_CHARS) return text;
  const cut = text.slice(0, MAX_ARTICLE_CHARS);
  const boundary = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("。"),
    cut.lastIndexOf("！"),
    cut.lastIndexOf("？"),
  );
  return (boundary > MAX_ARTICLE_CHARS * 0.6 ? cut.slice(0, boundary + 1) : cut).trim();
}

async function fetchSfcContent(url: URL): Promise<string> {
  if (url.hostname !== "apps.sfc.hk" || !url.pathname.startsWith("/edistributionWeb/")) return "";
  const refNo = url.searchParams.get("refNo");
  if (!refNo) return "";
  const lang = url.pathname.includes("/EN/") ? "EN" : "TC";
  const apiUrl = `https://apps.sfc.hk/edistributionWeb/api/news/content?refNo=${encodeURIComponent(refNo)}&lang=${lang}`;
  const res = await fetch(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return "";
  const payload = await res.json() as { html?: unknown };
  const html = String(payload.html || "");
  if (!html) return "";
  return truncateArticle(load(html).text());
}

function articleBodyFromJsonLd($: ReturnType<typeof load>): string {
  let longest = "";
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const parsed = JSON.parse($(node).text()) as unknown;
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length > 0) {
        const value = queue.shift();
        if (Array.isArray(value)) {
          queue.push(...value);
          continue;
        }
        if (!value || typeof value !== "object") continue;
        const record = value as Record<string, unknown>;
        if (typeof record.articleBody === "string" && record.articleBody.length > longest.length) {
          longest = record.articleBody;
        }
        if (record["@graph"]) queue.push(record["@graph"]);
      }
    } catch {
      // 忽略无效 JSON-LD。
    }
  });
  return longest;
}

function paragraphsFrom(html: string): string {
  const $ = load(html);
  const jsonLdBody = articleBodyFromJsonLd($);
  if (jsonLdBody.length >= 300) return truncateArticle(jsonLdBody);

  $("script,style,noscript,nav,header,footer,aside,form").remove();
  const selectors = [
    "article p",
    "[role='main'] p",
    "main p",
    ".article-content p",
    ".article-body p",
    ".Article_content p",
    ".main-content p",
    ".content-wrapper__content p",
    ".richtext-block p",
    ".col-md-8 p",
    ".entry-content p",
    ".post-content p",
    ".news-content p",
    ".detail-news p",
    ".TRS_Editor p",
    "#zoom p",
    "#content p",
    ".content p",
  ];
  const seen = new Set<string>();
  const paragraphs: string[] = [];
  for (const selector of selectors) {
    $(selector).each((_, node) => {
      const text = cleanSummaryText($(node).text());
      if (text.length < 30 || seen.has(text)) return;
      seen.add(text);
      paragraphs.push(text);
    });
    if (paragraphs.join(" ").length >= 600) break;
  }
  const paragraphText = truncateArticle(paragraphs.join(" "));
  if (paragraphText.length >= 200) return paragraphText;

  const allParagraphs = $("p")
    .map((_, node) => cleanSummaryText($(node).text()))
    .get()
    .filter((text, index, values) => text.length >= 35 && values.indexOf(text) === index)
    .join(" ");
  if (allParagraphs.length >= 200) return truncateArticle(allParagraphs);

  let containerText = "";
  $("[ergodic='article'], .art-con, .TRS_Editor, .article_con, .article-body, .article-content, .Article_content, .main-content, .content-wrapper__content, .richtext-block, .col-md-8, .news-content, .detail-news")
    .each((_, node) => {
      const text = cleanSummaryText($(node).text());
      if (text.length > containerText.length) containerText = text;
    });
  if (containerText.length >= 120) return truncateArticle(containerText);

  const fallback = cleanSummaryText(
    $('meta[name="description"], meta[name="Description"], meta[property="og:description"]').first().attr("content") || "",
  );
  return fallback.length >= 120 ? truncateArticle(fallback) : paragraphText;
}

async function getBrowser(): Promise<Browser | null> {
  if (sharedBrowser?.isConnected()) return sharedBrowser;
  const executablePath = EDGE_PATHS.find((path) => existsSync(path));
  if (!executablePath) return null;
  sharedBrowser = await chromium.launch({ executablePath, headless: true });
  return sharedBrowser;
}

async function renderArticle(html: string): Promise<string> {
  const text = paragraphsFrom(html);
  return text.length >= 120 ? text : "";
}

async function renderArticleWithBrowser(url: string): Promise<string> {
  if (/\.pdf(?:$|[?#])/i.test(url)) return "";
  try {
    const browser = await getBrowser();
    if (!browser) return "";
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      locale: "en-US",
    });
    const page = await context.newPage();
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      if (!response || response.status() >= 400) return "";
      await page.waitForTimeout(1_500);
      const htmlText = await renderArticle(await page.content());
      if (htmlText.length >= 120) return htmlText;
      for (const selector of [
        "article",
        ".content-wrapper__content",
        ".richtext-block",
        ".article-body",
        ".article-content",
        "main",
      ]) {
        const locator = page.locator(selector).first();
        if (await locator.count() === 0) continue;
        const text = cleanSummaryText(await locator.innerText().catch(() => ""));
        if (text.length >= 120) return truncateArticle(text);
      }
      return "";
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  } catch {
    return "";
  }
}

export async function closeArticleBrowser(): Promise<void> {
  if (!sharedBrowser) return;
  const browser = sharedBrowser;
  sharedBrowser = null;
  await browser.close().catch(() => undefined);
}

export async function fetchArticleContent(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) return "";
  try {
    const parsed = new URL(url);
    const sfc = await fetchSfcContent(parsed);
    if (sfc.length >= 120) return sfc;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return await renderArticleWithBrowser(url);
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !contentType.includes("html")) return "";
    const text = paragraphsFrom(await res.text());
    return text.length >= 120 ? text : await renderArticleWithBrowser(url);
  } catch {
    return renderArticleWithBrowser(url);
  }
}
