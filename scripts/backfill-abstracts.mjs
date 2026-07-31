// ESG Compass — 学术摘要回填
// 重新拉取 Crossref 元数据，把存量 contents.json 中截断的英文摘要替换为完整版。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SOURCES_FILE = resolve(ROOT, "data", "sources.json");
const CONTENTS_FILE = resolve(ROOT, "data", "contents.json");
const ABSTRACT_MAX_LENGTH = 6000;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

async function fetchWithRetry(url, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error("请求失败: " + url);
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchCrossrefMap(source) {
  const q = encodeURIComponent(source.query || "ESG sustainability");
  const rows = source.rows || 10;
  const from = new Date(Date.now() - (source.fromDays || 90) * 86400000).toISOString().slice(0, 10);
  const apiUrl = `${source.url}?query=${q}&filter=from-pub-date:${from},type:journal-article&rows=${rows}&select=title,URL,published,abstract,container-title`;
  const res = await fetchWithRetry(apiUrl);
  if (!res.ok) throw new Error("Crossref 返回 " + res.status);
  const data = await res.json();
  const map = new Map();
  for (const it of data.message?.items || []) {
    if (!it.URL) continue;
    const abstract = stripHtml(it.abstract).slice(0, ABSTRACT_MAX_LENGTH);
    if (abstract) map.set(String(it.URL).replace(/\/$/, ""), abstract);
  }
  return map;
}

const sources = JSON.parse(readFileSync(SOURCES_FILE, "utf-8")).sources;
const src = sources.find((s) => s.id === "ssrn-esg");
if (!src) {
  console.error("未找到 ssrn-esg 信源");
  process.exit(1);
}

const map = await fetchCrossrefMap(src);
console.log("Crossref 摘要映射：" + map.size + " 条");

const items = JSON.parse(readFileSync(CONTENTS_FILE, "utf-8"));
let updated = 0;
for (const item of items) {
  if (item.aiDraft === true) continue;
  const key = String(item.sourceUrl || "").replace(/\/$/, "");
  const full = map.get(key);
  if (!full) continue;
  if (full.length > String(item.summary || "").length) {
    item.summary = full;
    updated += 1;
  }
}
writeFileSync(CONTENTS_FILE, JSON.stringify(items, null, 2), "utf-8");
console.log("已回填 " + updated + " 条完整摘要");
