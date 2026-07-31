import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "data");

// ── 配置 ──────────────────────────────────────────────
const CONFIG = {
  sourcesPath: resolve(DATA, "sources.json"),
  contentsPath: resolve(DATA, "contents.json"),
  hashesPath: resolve(DATA, "seen_hashes.json"),
  statusPath: resolve(DATA, "pipeline-status.json"),
  llmApiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
  llmBaseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
};

// ── 帮助函数 ──────────────────────────────────────────
function hash(url, sourceId) {
  return createHash("sha256").update(`${sourceId}::${url}`).digest("hex").slice(0, 12);
}

function readJSON(path) {
  try {
    let text = readFileSync(path, "utf-8");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return JSON.parse(text);
  } catch { return null; }
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function makeId(title, sourceId = "", url = "") {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const prefix = sourceId ? `${sourceId.slice(0, 16).replace(/[^a-z0-9]+/g, "-")}-` : "";
  const suffix = url ? `-${hash(url, sourceId).slice(0, 4)}` : "";
  return `src-${prefix}${slug}${suffix}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── 统一抓取层 ─────────────────────────────────────────
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
  "Cache-Control": "no-cache",
};

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { ...BROWSER_HEADERS, ...(options.headers || {}) },
        signal: AbortSignal.timeout(options.timeoutMs || 20000),
        ...options,
      });
      if ((res.status === 429 || res.status >= 500 || res.status === 403) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error(`请求失败: ${url}`);
}
// ── 步骤 1：加载信源 ─────────────────────────────────
function loadSources() {
  const data = readJSON(CONFIG.sourcesPath);
  if (!data || !data.sources) {
    console.error("❌ 未找到 sources.json，请先配置信源清单");
    process.exit(1);
  }
  const active = data.sources.filter((s) => s.enabled);
  console.log(`📡 信源：共 ${data.sources.length} 个，启用 ${active.length} 个`);
  return active;
}

// ── 步骤 2：抓取 ─────────────────────────────────────
function loadSeenHashes() {
  return new Set(readJSON(CONFIG.hashesPath)?.hashes ?? []);
}

function saveSeenHashes(hashes) {
  writeJSON(CONFIG.hashesPath, { hashes: [...hashes] });
}

async function fetchRSS(source) {
  const { default: Parser } = await import("rss-parser");
  const parser = new Parser();
  const url = source.rssUrl || source.url;
  const res = await fetchWithRetry(url, { timeoutMs: 20000 });
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  return (feed.items || []).map((item) => ({
    title: item.title || "(无标题)",
    summary: item.contentSnippet || item.content?.replace(/<[^>]+>/g, "") || item.summary || "",
    link: item.link || "",
    date: (item.isoDate || item.pubDate || "").slice(0, 10) || today(),
    source,
  }));
}

async function scrapeWebpage(source) {
  const { load } = await import("cheerio");
  const res = await fetchWithRetry(source.url, { timeoutMs: 20000 });
  if (!res.ok) {
    console.warn(`  ⚠️  ${source.name} 返回 ${res.status}，跳过`);
    return [];
  }
  const html = await res.text();
  const $ = load(html);

  // 尝试常见列表页模式
  const items = [];
  const selectors = ["article", ".post", ".news-item", ".item", "li", "tr"];
  for (const sel of selectors) {
    const elements = $(sel);
    if (elements.length >= 3) {
      elements.each((_, el) => {
        const $el = $(el);
        const linkEl = $el.find("a").first();
        const href = linkEl.attr("href") || "";
        const title = linkEl.text().trim() || $el.find("h2, h3, h4").first().text().trim() || $el.text().trim().slice(0, 100);
        if (title && href) {
          const absUrl = href.startsWith("http") ? href : new URL(href, source.url).href;
          items.push({
            title: title.slice(0, 200),
            summary: $el.find("p").first().text().trim().slice(0, 500) || "",
            link: absUrl,
            date: today(),
            source,
          });
        }
      });
      if (items.length > 2) break; // 找到容器，不再尝试更多选择器
    }
  }
  const limited = items.slice(0, source.limit || 30);
  console.log(`  📄  ${source.name}：解析到 ${limited.length} 条（共 ${items.length} 条候选）`);
  return limited;
}

async function fetchMarkdown(source) {
  const res = await fetchWithRetry(source.url, { timeoutMs: 20000 });
  if (!res.ok) {
    console.warn(`  ⚠️  ${source.name} 返回 ${res.status}，跳过`);
    return [];
  }
  const md = await res.text();
  const items = [];
  const re = /- \[([^\]]+)\]\(([^)]+)\)\s*(?:\((\d{4}-\d{2}-\d{2})\))?/g;
  let m;
  while ((m = re.exec(md))) {
    const raw = m[2];
    const absUrl = raw.startsWith("http") ? raw : new URL(raw, source.url).href;
    items.push({
      title: m[1].trim().slice(0, 200),
      summary: "",
      link: absUrl.replace(/\.md$/, ""),
      date: m[3] || today(),
      source,
    });
  }
  console.log(`  📄  ${source.name}：解析到 ${items.length} 条`);
  return items;
}

async function fetchSitemapArticle(url, source) {
  const res = await fetchWithRetry(url, { timeoutMs: 15000 });
  const html = await res.text();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  const title = h1 || html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "(无标题)";
  const desc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] || "";
  const p = html.match(/<p[^>]*>([\s\S]{40,500}?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
  const dm = url.match(/\/news\/(\d{4})\/(\d{2})\//);
  return {
    title: title.slice(0, 200),
    summary: (desc || p).slice(0, 500),
    link: url,
    date: dm ? `${dm[1]}-${dm[2]}-01` : today(),
    source,
  };
}

async function fetchSitemap(source) {
  const res = await fetchWithRetry(source.url, { timeoutMs: 25000 });
  const xml = await res.text();
  const prefix = source.urlPrefix || "/news-and-events/news/";
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes(prefix));
  locs.sort((a, b) => b.localeCompare(a));
  const recent = locs.slice(0, source.limit || 10);
  const items = [];
  for (const url of recent) {
    try {
      items.push(await fetchSitemapArticle(url, source));
    } catch (err) {
      console.warn(`  ⚠️  文章抓取失败 ${url.slice(-50)}：${err.message.slice(0, 50)}`);
    }
  }
  console.log(`  📄  ${source.name}：解析到 ${items.length} 条`);
  return items;
}

async function fetchCrossref(source) {
  const q = encodeURIComponent(source.query || "ESG sustainability");
  const rows = source.rows || 10;
  const from = new Date(Date.now() - (source.fromDays || 30) * 86400000).toISOString().slice(0, 10);
  const apiUrl = `${source.url}?query=${q}&filter=from-pub-date:${from},type:journal-article&rows=${rows}&select=title,URL,published,abstract,container-title`;
  const res = await fetchWithRetry(apiUrl, { timeoutMs: 25000 });
  if (!res.ok) {
    console.warn(`  ⚠️  ${source.name} 返回 ${res.status}，跳过`);
    return [];
  }
  const data = await res.json();
  const items = (data.message?.items || [])
    .filter((it) => it.title && it.URL)
    .map((it) => ({
      title: (Array.isArray(it.title) ? it.title.join(" ") : String(it.title || "")).slice(0, 200),
      summary: (it.abstract || "").replace(/<[^>]+>/g, "").slice(0, 500),
      link: it.URL,
      date: it.published?.["date-parts"]?.[0]?.slice(0, 3).join("-") || today(),
      source,
    }));
  console.log(`  📄  ${source.name}：解析到 ${items.length} 条`);
  return items;
}

const FETCHERS = {
  rss: fetchRSS,
  webpage: scrapeWebpage,
  markdown: fetchMarkdown,
  sitemap: fetchSitemap,
  api: fetchCrossref,
};
// ── 步骤 3：去重 ─────────────────────────────────────
function deduplicate(rawItems, seenHashes) {
  const hashes = seenHashes;
  const newItems = [];
  for (const item of rawItems) {
    if (!item.link) continue;
    const h = hash(item.link, item.source.id);
    if (hashes.has(h)) continue;
    hashes.add(h);
    newItems.push(item);
  }
  return { newItems, hashes };
}

// ── 步骤 4：LLM 结构化 ──────────────────────────────
async function structureItem(item, index, total) {
  const { source } = item;
  const systemPrompt = `你是一份 ESG 情报的结构化编辑助手。收到一条原始资讯后，严格按以下 JSON 格式输出，不包含 Markdown 代码块包装：

{
  "summary": "140 字以内的中文摘要",
  "esgTopic": "从 SASB 分类中选择最匹配的一项：温室气体排放 / 气候风险 / 供应链管理 / 水资源管理 / 人权与劳工 / 合规与监管 / 数据安全 / 社区关系 / 废弃物管理 / 产品质量与安全",
  "importanceLevel": "高 | 中 | 低"
}

注意：不要添加原始内容中没有的事实。如果不足以判断则 importanceLevel 填"中"，esgTopic 填最接近的类别。`;

  const userMsg = `原始内容：
标题：${item.title}
摘要：${item.summary}`;

  const requestBody = {
    model: CONFIG.llmModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  };

  const res = await fetch(`${CONFIG.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.llmApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    console.error(`  ❌ LLM 调用失败 (${res.status})：${err.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  let structured;
  try {
    structured = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  } catch {
    console.error(`  ❌ LLM 返回非 JSON：${(data.choices?.[0]?.message?.content || "").slice(0, 200)}`);
    return null;
  }

  const importance = ["高", "中", "低"].includes(structured.importanceLevel) ? structured.importanceLevel : "中";

  console.log(`  ✅  [${index}/${total}] ${structured.importanceLevel} | ${item.title.slice(0, 30)}… → ${structured.esgTopic}`);

  if (structured.relevant === false) {
    console.log(`  \u{1f4cd} [${index}/${total}] 跳过（非 ESG 相关）: ${item.title.slice(0, 40)}`);
    return null;
  }

  return {
    id: makeId(item.title, item.source.id, item.link || item.source.url),
    title: item.title,
    contentType: structured.contentType || source.contentType,
    region: source.region,
    publishedAt: item.date,
    importanceLevel: importance,
    summary: structured.summary || item.summary,
    sourceName: source.name,
    sourceUrl: item.link || source.url,
    esgTopic: structured.esgTopic || "合规与监管",
    aiDraft: true,
  };
}

// ── 步骤 4b：无 LLM key 时的本地规则兜底 ─────────────
function fallbackStructure(item) {
  const { source } = item;
  return {
    id: makeId(item.title, source.id, item.link || source.url),
    title: item.title,
    contentType: source.contentType,
    region: source.region,
    publishedAt: item.date,
    importanceLevel: "中",
    summary: item.summary || item.title,
    sourceName: source.name,
    sourceUrl: item.link || source.url,
    esgTopic: "合规与监管",
    aiDraft: false,
  };
}

// ── 步骤 5：写入 contents.json ──────────────────────
function appendContents(newStructuredItems) {
  const existing = readJSON(CONFIG.contentsPath);
  const items = Array.isArray(existing) ? existing : [];
  items.push(...newStructuredItems);
  writeJSON(CONFIG.contentsPath, items);
}

// ── 主流程 ──────────────────────────────────────────
async function main() {
  console.log("\n═══════════════════════════════════════");
  console.log("  ESG 快讯 — 数据管道");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════\n");

  // 1. 加载信源
  const sources = loadSources();

  // 2. 抓取所有信源
  const allRaw = [];
  const statuses = [];
  for (const source of sources) {
    process.stdout.write(`🔍  [${source.contentType}] ${source.name}...`);
    const status = { id: source.id, name: source.name, type: source.type, ok: false, count: 0, error: "", lastFetchAt: new Date().toISOString() };
    try {
      const fetchFn = FETCHERS[source.type] || scrapeWebpage;
      const items = await fetchFn(source);
      allRaw.push(...items);
      status.ok = true;
      status.count = items.length;
      process.stdout.write(` ${items.length} 条\n`);
    } catch (err) {
      status.error = err.message.slice(0, 120);
      process.stdout.write(` 错误：${err.message.slice(0, 80)}\n`);
    }
    statuses.push(status);
  }

  writeJSON(CONFIG.statusPath, {
    lastRunAt: new Date().toISOString(),
    sources: statuses,
    totalFetched: allRaw.length,
  });

  console.log(`\n📦 共抓取 ${allRaw.length} 条原始内容`);

  // 3. 去重
  const seen = loadSeenHashes();
  const { newItems, hashes } = deduplicate(allRaw, seen);
  console.log(`🔄 去重后新增 ${newItems.length} 条`);

  if (newItems.length === 0) {
    console.log("✅ 无新增内容，管道结束");
    return;
  }

  // 4. 结构化：配置了 LLM key 时调用 LLM，否则使用本地规则兜底
  let structured;
  if (!CONFIG.llmApiKey) {
    console.log("\n⚙️ 未配置 LLM_API_KEY，使用本地规则结构化（aiDraft=false）");
    structured = newItems.map((item) => fallbackStructure(item));
    console.log(`\n📝 本地兜底完成：${structured.length}/${newItems.length} 条`);
  } else {
    console.log(`\n🤖 LLM 结构化（模型：${CONFIG.llmModel}）...`);
    structured = [];
    for (let i = 0; i < newItems.length; i++) {
      const result = await structureItem(newItems[i], i + 1, newItems.length);
      if (result) structured.push(result);
    }
    console.log(`\n📝 LLM 完成：${structured.length}/${newItems.length} 条成功`);
  }

  // 5. 写入
  if (structured.length > 0) {
    appendContents(structured);
    saveSeenHashes(hashes);
    console.log(`💾 已追加 ${structured.length} 条到 data/contents.json`);
  }

  console.log("\n✅ 管道执行完毕");
}

main().catch((err) => {
  console.error("❌ 管道异常终止：", err);
  process.exit(1);
});
