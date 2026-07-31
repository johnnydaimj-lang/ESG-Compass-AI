// ESG Compass — 管道质量门禁与启发式精选
// 供 scripts/pipeline.mjs 使用：垃圾过滤、ESG 相关性、无 LLM 时的精选评分。

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const JUNK_TITLES = new Set([
  "english", "news & opinion", "news", "opinion", "eb studio", "press releases",
  "events", "intelligence", "training", "advertise", "about us", "about",
  "international", "asia pacific", "china", "usa", "europe",
  "forests", "research", "data", "initiatives", "insights", "donate",
  "resource library", "experts", "careers", "our work", "africa",
  "trusted websites", "contact us", "subscribe", "search", "privacy policy",
  "terms of use", "sign in", "log in", "register",
]);

const JUNK_TITLE_PATTERNS = [
  /^daily news \d{2} \/ \d{2} \/ \d{4}$/i,
  /^trusted websites/i,
];

const JUNK_URL_PATTERNS = [
  /index\.php/i,
  /index%2e/i,
  /\/search\b/i,
  /[?&]s=/i,
  /\/category\//i,
  /\/tag\//i,
];

function normalizeTitle(title) {
  return String(title || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function isJunkItem(item) {
  const title = normalizeTitle(item.title);
  const link = String(item.link || "").toLowerCase();
  const sourceUrl = String(item.source?.url || "").toLowerCase().replace(/\/$/, "");

  if (!title) return true;
  if (JUNK_TITLES.has(title)) return true;
  if (JUNK_TITLE_PATTERNS.some((re) => re.test(title))) return true;
  if (JUNK_URL_PATTERNS.some((re) => re.test(link))) return true;
  if (sourceUrl && (link === sourceUrl || link === sourceUrl + "/")) return true;
  if (/^[a-z0-9 &|/._-]{1,12}$/.test(title)) return true;
  return false;
}

const ESG_STRONG_KEYWORDS = [
  "esg", "sustainability", "sustainable", "climate", "carbon", "emissions",
  "emission", "greenhouse", "net-zero", "net zero", "green transition",
  "green deal", "clean energy", "renewable", "taxonomy", "disclosure",
  "green", "nature", "natural capital",
  "csrd", "csddd", "cbam", "issb", "tnfd", "sfdr", "eugbs", "biodiversity",
  "deforestation", "labor rights", "labour rights", "human rights",
  "supply chain", "supply-chain", "due diligence", "forced labour",
  "forced labor", "circular economy", "green finance", "transition finance",
  "just transition", "social climate", "green bonds", "sustainable finance",
  "energy transition", "environmental", "natural capital", "nature-based",
  "decarbon", "climate risk", "climate-related", "sustainability-linked",
  "绿色", "可持续", "气候", "碳", "排放", "生物多样", "供应链", "劳工",
  "人权", "尽职调查", "绿色金融", "转型金融", "循环经济", "环境",
  "披露", "合规",
];

export function isEsgRelevant(text) {
  const t = String(text || "").toLowerCase();
  return ESG_STRONG_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

const URGENCY_TERMS = [
  "正式生效", "正式收费", "生效", "强制", "执法", "截止", "deadline",
  "进入", "启动", "首轮", "首个", "首次", "立即", "proposes", "proposed", "final",
];
const BREADTH_TERMS = [
  "欧盟", "全球", "多国", "国际", "供应链", "行业", "企业", "上市公司",
  "跨国", "进出口", "亚洲", "美国", "中国", "新加坡", "所有", "多数", "范围",
  "industry", "industries", "companies", "global", "europe", "asia", "supply chain",
];
const CONVERTIBILITY_TERMS = [
  "披露", "报告", "认证", "申报", "补贴", "融资", "债券", "贷款", "激励",
  "合规", "标准", "指南", "评级", "投资", "成本", "风险", "机遇",
  "disclosure", "reporting", "certif", "taxonomy", "rating", "finance",
  "bond", "loan", "incentive",
];

function countHits(text, terms) {
  const t = String(text || "").toLowerCase();
  let count = 0;
  for (const term of terms) {
    if (t.includes(term.toLowerCase())) count += 1;
  }
  return Math.min(count, 3);
}

export function heuristicCurate(item, importanceLevel = "中") {
  const result = curateWithScore(item, importanceLevel);
  return { recommended: result.recommended, whyMatters: result.whyMatters };
}

function clampDim(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

function dimsFromText(item) {
  const text = `${item.title} ${item.summary || ""}`;
  return {
    urgency: countHits(text, URGENCY_TERMS),
    breadth: countHits(text, BREADTH_TERMS),
    convertibility: countHits(text, CONVERTIBILITY_TERMS),
  };
}

// 选题价值：学术文章/评级动态等内容上的“值得关注”信号
const TOPIC_VALUE_TERMS = [
  "rating disagreement", "greenwashing", "llm-assisted", "artificial intelligence",
  "machine learning", "climate-disclosure regulation", "climate risk",
  "decarbon", "forced labour", "forced labor", "deforestation", "biodiversity",
  "nature", "taxonomy", "due diligence", "supply chain", "net zero",
  "transition finance", "green finance", "green bonds", "carbon market",
  "sustainability reporting", "disclosure quality", "digital transformation",
  "staggered adoption", "curated benchmark", "reproducible pipeline",
  "social climate", "clean transition", "sustainable finance",
  "green transition", "renewable", "energy transition",
];

function topicValueFromText(text) {
  const t = String(text || "").toLowerCase();
  let count = 0;
  const found = new Set();
  for (const term of TOPIC_VALUE_TERMS) {
    const k = term.toLowerCase();
    if (!found.has(k) && t.includes(k)) {
      found.add(k);
      count += 1;
    }
  }
  return Math.min(count, 3);
}

export function curateWithScore(item, importanceLevel = "中", dims) {
  const d = dims ?? dimsFromText(item);
  const urgency = clampDim(d.urgency);
  const breadth = clampDim(d.breadth);
  const convert = clampDim(d.convertibility);
  const topic = clampDim(d.topicValue ?? topicValueFromText(`${item.title} ${item.summary || ""}`));
  const isAcademic = item.contentType === "学术文章" || item.source?.contentType === "学术文章";
  const topicWeight = isAcademic ? 2 : 1;
  const score = urgency * 2 + breadth * 1 + convert * 1.5 + topic * topicWeight;
  const recommended = score >= 5 && (urgency >= 1 || (topic >= 2 && convert >= 1));

  const labels = [];
  if (urgency >= 1) labels.push("紧迫：涉及生效/执法/时限");
  if (breadth >= 2) labels.push("面广：影响区域或主体范围大");
  if (convert >= 1) labels.push("可转化：有披露/合规/融资等落地动作");
  if (topic >= 2) labels.push("选题价值：关联披露/评级/供应链等关键议题的研究或动态");

  return {
    recommended,
    score,
    urgency,
    breadth,
    convertibility: convert,
    topicValue: topic,
    whyMatters: recommended && labels.length > 0
      ? `信号：${importanceLevel} | ${labels.join("；")}。建议结合所在区域与行业评估直接影响，并跟踪后续细则。`
      : undefined,
  };
}

export function curateFromDims(item, importanceLevel, dims) {
  const result = curateWithScore(item, importanceLevel, dims);
  return { recommended: result.recommended, whyMatters: result.whyMatters };
}

// ── 评级动态专项筛选 ────────────────────────────────
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
let FOCUS_COMPANIES = [];
try {
  const raw = readFileSync(resolve(MODULE_DIR, "..", "data", "focus-companies.json"), "utf-8");
  FOCUS_COMPANIES = JSON.parse(raw).companies || [];
} catch { FOCUS_COMPANIES = []; }

const RATING_RATER_TERMS = [
  "msci", "sustainalytics", "s&p global", "sp global", "s&p", "cdp",
  "ecovadis", "wind esg", "ftse", "djsi", "moody", "lseg", "refinitiv",
  "iss esg", "hang seng", "hkex", "sse", "szse", "nasdaq", "nyse", "lse", "sgx",
  "esg rating", "esg ratings", "esg score", "esg index",
  "标普", "万得", "商道融绿", "中证", "华证", "恒生",
  "上交所", "深交所", "港交所", "上证", "深证",
];

const RATING_METHODOLOGY_TERMS = [
  "rating methodology", "esg methodology", "score methodology", "index methodology",
  "methodology update", "methodology change", "methodology revision", "methodology review",
  "methodology", "criteria update", "criteria change", "criteria revision",
  "model update", "model change", "model revision", "annual review", "annual methodology",
  "questionnaire update", "weighting update", "weighting change", "weighting",
  "framework update", "framework change", "framework revision", "recalibrat",
  "index rules", "index review", "index consultation",
  "方法论", "方法更新", "方法调整", "方法修订", "评级方法", "评分方法",
  "模型调整", "模型更新", "评分模型", "评级模型", "权重调整", "权重",
  "指数编制", "指数方法", "评估方法", "核心指标", "审核标准",
  "评分标准", "评级标准", "考核方法", "评价体系",
];

const RATING_ACTION_TERMS = [
  "upgrade", "upgraded", "downgrade", "downgraded", "improved", "improvement",
  "raised", "lowered", "included in", "added to", "removed from", "excluded from",
  "first time", "first-ever", "leaderboard", "a list", "top 1%", "top 5%", "top 10%",
  "score of", "scored", "score", "scores", "awarded", "recognized", "recognition", "achieved",
  "aa", "aaa", "platinum", "gold", "silver", "bronze",
  "rating change", "rating upgrade", "rating downgrade", "rating revision",
  "上调", "下调", "提升", "降低", "获评", "入选", "被剔除", "剔除", "评级结果", "评分结果",
  "第一次", "首次", "评级变动", "评级调整", "评级提升", "评级下调",
];

const RATING_STABLE_TERMS = [
  "unchanged", "maintains", "maintained", "retains", "reaffirm", "reaffirmed", "no change",
  "保持", "维持", "不变",
];

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRatingTerm(text, term) {
  const t = String(term).toLowerCase();
  if (/^[\x00-\x7f]+$/.test(t)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`, "i").test(text);
  }
  return text.includes(t);
}

export function isRatingRelevant(item) {
  const text = `${item.title || ""} ${item.summary || ""} ${item.source?.name || item.sourceName || ""} ${item.link || item.sourceUrl || ""}`.toLowerCase();
  const hasRater = RATING_RATER_TERMS.some((t) => hasRatingTerm(text, t));
  const hasMethodology = RATING_METHODOLOGY_TERMS.some((t) => hasRatingTerm(text, t));
  const hasAction = RATING_ACTION_TERMS.some((t) => hasRatingTerm(text, t));
  const hasStableOnly = RATING_STABLE_TERMS.some((t) => hasRatingTerm(text, t));
  const companyHit = FOCUS_COMPANIES.some((c) => hasRatingTerm(text, c));
  const hasCompanyChange = companyHit && hasAction && !hasStableOnly;

  if (hasRater && hasMethodology) return true;
  if (hasRater && hasAction && !hasStableOnly) return true;
  if (hasCompanyChange) return true;
  return false;
}
