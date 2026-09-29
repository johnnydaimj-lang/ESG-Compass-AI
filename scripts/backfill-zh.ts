// 为发布快照中缺失中文的内容补齐 titleZh / summaryZh，并重建当日日报。
// 默认使用公开翻译接口；可用 TRANSLATE_ENDPOINT 覆盖。

import { buildDailyReport } from "@/lib/pipeline/daily";
import { readPublishedContents, readStories, writeDaily, writePublishedContents } from "@/lib/publication-store";

const GOOGLE_ENDPOINT = process.env.TRANSLATE_ENDPOINT || "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const CJK_RE = /[\u3400-\u9fff]/;
const CHUNK_SIZE = 450;

function hasChinese(text: string): boolean {
  return CJK_RE.test(String(text || ""));
}

function needsChinese(text: string): boolean {
  const value = String(text || "").trim();
  if (!value) return false;
  const ratio = (value.match(/[\u3400-\u9fff]/g) || []).length / value.length;
  return ratio < 0.35 && /[A-Za-z]{3}/.test(value);
}

function usable(translated: string, source: string): boolean {
  const out = String(translated || "").trim();
  if (!out || !hasChinese(out)) return false;
  return out.toLowerCase().replace(/\s+/g, " ").trim()
    !== String(source || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function polish(text: string): string {
  return String(text || "")
    .replace(/\s+([，。！？；：、）】》])/g, "$1")
    .replace(/([（【《])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/UNEP\s*[-—]\s*联合国环境规划署/g, "联合国环境规划署")
    .replace(/强制劳动力/g, "强迫劳动")
    .replace(/反森林砍伐/g, "反毁林")
    .trim();
}

function decodeEntities(text: string): string {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function splitText(value: string): string[] {
  const text = String(value || "").trim();
  if (text.length <= CHUNK_SIZE) return text ? [text] : [];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_SIZE) {
    const window = rest.slice(0, CHUNK_SIZE);
    const cut = Math.max(window.lastIndexOf("。"), window.lastIndexOf("！"), window.lastIndexOf("？"), window.lastIndexOf(". "));
    const end = cut > CHUNK_SIZE * 0.55 ? cut + 1 : CHUNK_SIZE;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function googleTranslate(value: string): Promise<string> {
  const url = `${GOOGLE_ENDPOINT}?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(value)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as Array<Array<[string]>>;
  return decodeEntities((data?.[0] || []).map((part) => part?.[0] || "").join(""));
}

async function myMemoryTranslate(value: string): Promise<string> {
  const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(value)}&langpair=en|zh-CN`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json() as { responseData?: { translatedText?: string } };
  return decodeEntities(data?.responseData?.translatedText || "");
}

async function translateText(value: string): Promise<string> {
  try {
    const out = polish(await googleTranslate(value));
    if (usable(out, value)) return out;
    throw new Error("untranslated");
  } catch {
    const translated: string[] = [];
    for (const chunk of splitText(value)) translated.push(await myMemoryTranslate(chunk));
    const out = polish(translated.join(" "));
    if (!usable(out, value)) throw new Error("translation validation failed");
    return out;
  }
}

async function runQueue(tasks: string[], concurrency = 4): Promise<Array<{ ok: boolean; value: string }>> {
  const results = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          results[index] = { ok: true, value: await translateText(tasks[index]) };
          break;
        } catch {
          if (attempt === 3) results[index] = { ok: false, value: "" };
          else await new Promise((r) => setTimeout(r, 900 * attempt));
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const contents = readPublishedContents();
  const tasks: string[] = [];
  const slots: Array<{ itemIndex: number; field: "titleZh" | "summaryZh" }> = [];

  contents.forEach((item, itemIndex) => {
    if (needsChinese(item.title) && !usable(item.titleZh || "", item.title)) {
      tasks.push(item.title);
      slots.push({ itemIndex, field: "titleZh" });
    }
    if (needsChinese(item.summary) && !usable(item.summaryZh || "", item.summary)) {
      tasks.push(item.summary);
      slots.push({ itemIndex, field: "summaryZh" });
    }
  });

  const results = await runQueue(tasks);
  let translated = 0;
  let failed = 0;
  results.forEach((result, index) => {
    if (!result.ok) {
      failed += 1;
      return;
    }
    const slot = slots[index];
    contents[slot.itemIndex][slot.field] = result.value;
    translated += 1;
  });

  writePublishedContents(contents);
  writeDaily(buildDailyReport(contents, readStories(), new Date()));
  process.stdout.write(`zh backfill done: translated=${translated} failed=${failed} items=${contents.length}\n`);
  if (failed > 0) process.stdout.write("warning: 有翻译失败项，可稍后重跑；失败项不会覆盖原文。\n");
}

main().catch((error) => {
  process.stderr.write(`[backfill-zh] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
