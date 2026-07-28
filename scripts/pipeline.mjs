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

function makeId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `src-${slug}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
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
  const feed = await parser.parseURL(source.rssUrl || source.url);
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
  const res = await fetch(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ESG-Flux-Pipeline/1.0)" },
  });
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
  console.log(`  📄  ${source.name}：解析到 ${items.length} 条`);
  return items;
}

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

  return {
    id: makeId(item.title),
    title: item.title,
    contentType: source.contentType,
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
  for (const source of sources) {
    process.stdout.write(`🔍  [${source.contentType}] ${source.name}...`);
    try {
      const items = source.type === "rss" ? await fetchRSS(source) : await scrapeWebpage(source);
      allRaw.push(...items);
      process.stdout.write(` ${items.length} 条\n`);
    } catch (err) {
      process.stdout.write(` 错误：${err.message.slice(0, 80)}\n`);
    }
  }

  console.log(`\n📦 共抓取 ${allRaw.length} 条原始内容`);

  // 3. 去重
  const seen = loadSeenHashes();
  const { newItems, hashes } = deduplicate(allRaw, seen);
  console.log(`🔄 去重后新增 ${newItems.length} 条`);

  if (newItems.length === 0) {
    console.log("✅ 无新增内容，管道结束");
    return;
  }

  // 4. LLM 结构化
  if (!CONFIG.llmApiKey) {
    console.error("❌ 未设置 LLM_API_KEY 或 OPENAI_API_KEY，跳过 LLM 结构化");
    console.log("   请设置环境变量后再运行，或手动填写 data/contents.json");
    process.exit(1);
  }

  console.log(`\n🤖 LLM 结构化（模型：${CONFIG.llmModel}）...`);
  const structured = [];
  for (let i = 0; i < newItems.length; i++) {
    const result = await structureItem(newItems[i], i + 1, newItems.length);
    if (result) structured.push(result);
  }
  console.log(`\n📝 LLM 完成：${structured.length}/${newItems.length} 条成功`);

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
