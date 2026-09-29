// 为有原文链接的事件抓取正文并翻译成中文，作为事件页的详细介绍。

import { load } from "cheerio";
import { cleanSummaryText } from "@/lib/pipeline/text";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const BODY_MAX = 2200;
const CHUNK_SIZE = 1600;
const GOOGLE = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY = "https://api.mymemory.translated.net/get";

function cleanBody(value: string): string {
  return cleanSummaryText(value);
}

function truncateBody(value: string): string {
  const text = cleanBody(value);
  if (text.length <= BODY_MAX) return text;
  const cut = text.slice(0, BODY_MAX);
  const boundary = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"));
  return (boundary > BODY_MAX * 0.5 ? cut.slice(0, boundary + 1) : cut).trim();
}

async function fetchBody(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0", Accept: "text/html" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const $ = load(html);

    const jsonLd = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get();
    for (const raw of jsonLd) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.articleBody === "string") {
          const text = truncateBody(parsed.articleBody);
          if (text.length >= 300) return text;
        }
      } catch {
        // ignore
      }
    }

    const paragraphs = $("article p, .entry-content p, .post-content p, .td-post-content p, main p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 30);
    return truncateBody(paragraphs.join(" "));
  } catch {
    return "";
  }
}

async function googleTranslate(value: string): Promise<string> {
  const url = `${GOOGLE}?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(value)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as Array<Array<[string]>>;
  return (data?.[0] || []).map((part) => part?.[0] || "").join("");
}

async function myMemoryTranslate(value: string): Promise<string> {
  const url = `${MYMEMORY}?q=${encodeURIComponent(value)}&langpair=en|zh-CN`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json() as { responseData?: { translatedText?: string } };
  return data?.responseData?.translatedText || "";
}

function splitText(value: string): string[] {
  const text = String(value || "").trim();
  if (text.length <= CHUNK_SIZE) return text ? [text] : [];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_SIZE) {
    const window = rest.slice(0, CHUNK_SIZE);
    const cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf("。"), window.lastIndexOf("！"), window.lastIndexOf("？"));
    const end = cut > CHUNK_SIZE * 0.5 ? cut + 1 : CHUNK_SIZE;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function translateBody(value: string): Promise<string> {
  try {
    const out = await googleTranslate(value);
    if (/[\u3400-\u9fff]/.test(out)) return out;
    throw new Error("untranslated");
  } catch {
    const parts: string[] = [];
    for (const chunk of splitText(value)) parts.push(await myMemoryTranslate(chunk));
    return parts.join("");
  }
}

async function main() {
  const contents = readPublishedContents();
  const targets = contents
    .map((item, index) => ({ index, url: item.articleUrl || "" }))
    .filter((entry) => entry.url.startsWith("http") && !contents[entry.index].bodyZh);

  let enriched = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const entry = targets[cursor++];
      const body = await fetchBody(entry.url);
      if (body.length < 300) continue;
      const bodyZh = await translateBody(body);
      if (!/[\u3400-\u9fff]/.test(bodyZh)) continue;
      contents[entry.index].body = body;
      contents[entry.index].bodyZh = bodyZh;
      enriched += 1;
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));

  writePublishedContents(contents);
  process.stdout.write(`bodies enriched: enriched=${enriched} targets=${targets.length} items=${contents.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`[enrich-bodies] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
