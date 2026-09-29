// 为发布快照中摘要过短的内容，从原文页面抓取总起段落，替换英文摘要并清空中文摘要以便重新翻译。

import { load } from "cheerio";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";
import { cleanSummaryText } from "@/lib/pipeline/text";

const MIN_LENGTH = 240;
const MAX_LENGTH = 600;

function cleanText(value: string): string {
  return cleanSummaryText(value);
}

function truncate(value: string, max = MAX_LENGTH): string {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"), cut.lastIndexOf("; "));
  return (boundary > max * 0.5 ? cut.slice(0, boundary + 1) : cut).trim();
}

async function fetchArticleLead(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0", Accept: "text/html" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const $ = load(html);

    const meta = $('meta[name="description"], meta[property="og:description"]').attr("content");
    if (meta) {
      const metaText = cleanText(meta);
      if (metaText.length >= 120) return truncate(metaText);
    }

    const jsonLd = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get();
    for (const raw of jsonLd) {
      try {
        const parsed = JSON.parse(raw);
        const body = parsed?.articleBody || parsed?.description;
        if (typeof body === "string") {
          const text = truncate(cleanText(body));
          if (text.length >= 160) return text;
        }
      } catch {
        // ignore malformed JSON-LD
      }
    }

    const paragraphs = $("article p, .entry-content p, .post-content p, .td-post-content p, main p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 40);
    const lead = paragraphs.slice(0, 3).join(" ");
    return truncate(lead);
  } catch {
    return "";
  }
}

async function runQueue(urls: Array<{ index: number; url: string }>, concurrency = 6): Promise<string[]> {
  const results = new Array<string>(urls.length).fill("");
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const slot = urls[cursor++];
      results[slot.index] = await fetchArticleLead(slot.url);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const contents = readPublishedContents();
  const targets = contents
    .map((item, index) => ({ index, url: item.articleUrl || "" }))
    .filter((entry) => entry.url.startsWith("http") && (contents[entry.index].summary || "").length < MIN_LENGTH);

  const leads = await runQueue(targets);
  let enriched = 0;
  targets.forEach((entry, i) => {
    const lead = leads[i];
    if (!lead || lead.length < 120) return;
    const item = contents[entry.index];
    if (lead.length <= (item.summary || "").length) return;
    item.summary = lead;
    item.summaryZh = "";
    enriched += 1;
  });

  writePublishedContents(contents);
  process.stdout.write(`leads enriched: enriched=${enriched} targets=${targets.length} items=${contents.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`[enrich-leads] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
