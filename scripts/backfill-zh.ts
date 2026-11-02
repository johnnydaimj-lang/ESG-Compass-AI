// 为发布快照中缺失中文的内容补齐 titleZh / summaryZh，并重建当日日报。
// 优先使用已配置的 LLM 批量翻译，失败项再回退到公开翻译接口。

import { getLlmConfig } from "@/lib/pipeline/llm";
import { buildDailyReport } from "@/lib/pipeline/daily";
import { readPublishedContents, readStories, writeDaily, writePublishedContents } from "@/lib/publication-store";

const GOOGLE_ENDPOINT = process.env.TRANSLATE_ENDPOINT || "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const CJK_RE = /[\u3400-\u9fff]/;
const CHUNK_SIZE = 450;
const LLM_BATCH_ITEMS = 20;
const LLM_BATCH_CHARS = 12_000;

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

type TranslationResult = { ok: boolean; value: string };

interface LlmTranslation {
  id: number;
  zh: string;
}

function parseLlmTranslations(raw: string): LlmTranslation[] {
  const text = String(raw || "").trim();
  const json = text.match(/\{[\s\S]*\}/)?.[0] || text.match(/\[[\s\S]*\]/)?.[0];
  if (!json) throw new Error("LLM translation returned no JSON");
  const parsed = JSON.parse(json) as { translations?: unknown } | unknown[];
  const values = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { translations?: unknown }).translations)
      ? (parsed as { translations: unknown[] }).translations
      : [];
  return values
    .map((entry) => {
      const item = entry as { id?: unknown; zh?: unknown };
      return { id: Number(item.id), zh: String(item.zh || "").trim() };
    })
    .filter((entry) => Number.isInteger(entry.id) && entry.zh.length > 0);
}

function llmBatches(tasks: string[]): Array<Array<{ id: number; text: string }>> {
  const batches: Array<Array<{ id: number; text: string }>> = [];
  let current: Array<{ id: number; text: string }> = [];
  let currentChars = 0;
  tasks.forEach((text, id) => {
    const size = text.length;
    if (current.length > 0 && (current.length >= LLM_BATCH_ITEMS || currentChars + size > LLM_BATCH_CHARS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push({ id, text });
    currentChars += size;
  });
  if (current.length > 0) batches.push(current);
  return batches;
}

async function translateLlmBatch(
  items: Array<{ id: number; text: string }>,
  config: NonNullable<ReturnType<typeof getLlmConfig>>,
): Promise<Map<number, string>> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是 ESG 新闻翻译，只输出合法 JSON。逐条把英文标题或摘要完整翻译成简体中文，保留专有名词、机构缩写、数字、日期和原文语气；不要概括、解释或遗漏句子。返回格式：{\"translations\":[{\"id\":0,\"zh\":\"译文\"}]}。",
        },
        {
          role: "user",
          content: JSON.stringify({ items }),
        },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const translations = parseLlmTranslations(data.choices?.[0]?.message?.content || "");
  const byId = new Map<number, string>();
  for (const item of translations) {
    const source = items.find((candidate) => candidate.id === item.id)?.text || "";
    const value = polish(item.zh);
    if (usable(value, source)) byId.set(item.id, value);
  }
  return byId;
}

async function translateWithLlm(tasks: string[]): Promise<TranslationResult[]> {
  const results = new Array<TranslationResult>(tasks.length);
  const config = getLlmConfig();
  if (!config || tasks.length === 0) return results;
  const llmConfig = config;

  const batches = llmBatches(tasks);
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      try {
        const translated = await translateLlmBatch(batch, llmConfig);
        for (const { id } of batch) {
          const value = translated.get(id);
          if (value) results[id] = { ok: true, value };
        }
      } catch {
        // 单批失败不阻断其他批次，未命中的条目交给公开翻译接口重试。
      }
    }
  }
  await Promise.all([worker(), worker()]);
  return results;
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

  const llmResults = await translateWithLlm(tasks);
  const fallbackTasks: string[] = [];
  const fallbackSlots: number[] = [];
  llmResults.forEach((result, index) => {
    if (!result?.ok) {
      fallbackTasks.push(tasks[index]);
      fallbackSlots.push(index);
    }
  });
  const fallbackResults = await runQueue(fallbackTasks);
  fallbackResults.forEach((result, index) => {
    llmResults[fallbackSlots[index]] = result;
  });

  let translated = 0;
  let llmTranslated = 0;
  let fallbackTranslated = 0;
  let failed = 0;
  llmResults.forEach((result, index) => {
    if (!result.ok) {
      failed += 1;
      return;
    }
    const slot = slots[index];
    contents[slot.itemIndex][slot.field] = result.value;
    translated += 1;
    if (fallbackSlots.includes(index)) fallbackTranslated += 1;
    else llmTranslated += 1;
  });

  writePublishedContents(contents);
  writeDaily(buildDailyReport(contents, readStories(), new Date()));
  process.stdout.write(
    `zh backfill done: translated=${translated} failed=${failed} llm=${llmTranslated} `
    + `fallback=${fallbackTranslated} items=${contents.length}\n`,
  );
  if (failed > 0) process.stdout.write("warning: 有翻译失败项，可稍后重跑；失败项不会覆盖原文。\n");
}

main().catch((error) => {
  process.stderr.write(`[backfill-zh] failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
