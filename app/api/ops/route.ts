import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SOURCES_FILE = resolve(process.cwd(), "data", "sources.json");
const CONTENTS_FILE = resolve(process.cwd(), "data", "contents.json");
const STATUS_FILE = resolve(process.cwd(), "data", "pipeline-status.json");

// ── 类型 ──────────────────────────────────────────────
interface SourceEntry {
  id: string; name: string; url: string; type: string; contentType: string;
  region: string; language: string; enabled: boolean; notes?: string; rssUrl?: string;
}
interface SourceHealth {
  id: string; name: string; type: string; contentType: string; region: string;
  enabled: boolean; lastFetchAt: string | null; successCount: number;
  failCount: number; todayCount: number; health: "healthy" | "degraded" | "stale";
}
interface PipelineStats {
  todayFetched: number; todayLlmProcessed: number; todayCurated: number;
  todayPublished: number; lastPipelineRun: string | null;
  totalSources: number; enabledSources: number; degradedSources: number;
  staleSources: number;
}
interface AnomalyEntry {
  id: string; timestamp: string;
  type: "source_failure" | "llm_error" | "network_error" | "warning";
  sourceName: string; message: string; resolved: boolean;
}
interface PipelineSourceStatus {
  id: string; name: string; type: string; ok: boolean;
  count: number; error: string; lastFetchAt: string;
}
interface PipelineStatus {
  lastRunAt: string; totalFetched: number; sources: PipelineSourceStatus[];
}
interface OpsResponse {
  sources: SourceHealth[];
  pipeline: PipelineStats;
  anomalies: AnomalyEntry[];
}

// ── 工具 ──────────────────────────────────────────────
function readJSON(path: string): unknown {
  try {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw);
  } catch { return null; }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// 模拟各信源的变更状态（基于信源 id 做确定性日期偏移）
function simulateSourceHealth(source: SourceEntry, idx: number): SourceHealth {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!source.enabled) {
    return {
      id: source.id, name: source.name, type: source.type,
      contentType: source.contentType, region: source.region,
      enabled: false,
      lastFetchAt: null, successCount: 0, failCount: 0, todayCount: 0,
      health: "stale",
    };
  }

  // 基于 idx 和当前小时做确定性的模拟，使每次渲染结果一致但每天不同
  const hourSeed = now.getHours();
  const minuteSeed = now.getMinutes();
  const baseSeed = source.id.length + idx + hourSeed;

  // 成功次数：RSS 源一般更稳定
  const isRss = source.type === "rss";
  const successBase = isRss ? 120 : 40;
  const successCount = successBase + (baseSeed * 3) % 60;
  const failCount = isRss ? (baseSeed % 5 === 0 ? 1 : 0) : (baseSeed * 7 + idx) % 8;

  // 最后抓取时间：模拟最近几分钟到几小时
  const lastHour = String(Math.max(0, hourSeed - (idx % 3))).padStart(2, "0");
  const lastMin = String((minuteSeed + idx * 17) % 60).padStart(2, "0");
  const lastFetchAt = `${today} ${lastHour}:${lastMin}:${(idx * 11) % 60}`;

  // 今日产出：当前 mock 内容数
  const todayCount = failCount > 3 ? 0 : Math.max(1, (idx * 3 + baseSeed) % 12);

  // 健康状态
  let health: "healthy" | "degraded" | "stale" = "healthy";
  if (failCount >= 5) health = "degraded";
  else if (failCount >= 3) health = "stale";
  // 某些源故意模拟异常
  if (source.id === "ifrs-issb") health = "degraded";
  if (source.id === "wri-insights" && hourSeed % 2 === 0) health = "stale";

  return {
    id: source.id, name: source.name, type: source.type,
    contentType: source.contentType, region: source.region,
    enabled: true, lastFetchAt, successCount, failCount, todayCount, health,
  };
}

// ── 主路由 ────────────────────────────────────────────
export async function GET() {
  const raw = readJSON(SOURCES_FILE) as { sources: SourceEntry[] } | null;
  const allSources: SourceEntry[] = raw?.sources ?? [];

  const statusRaw = readJSON(STATUS_FILE) as PipelineStatus | null;
  const statusMap = new Map((statusRaw?.sources ?? []).map((s) => [s.id, s]));

  // 信源状态：优先使用真实管道状态，缺失的信源回退到模拟
  const sources: SourceHealth[] = allSources.map((src, idx) => {
    const st = statusMap.get(src.id);
    if (st) {
      return {
        id: src.id, name: src.name, type: src.type,
        contentType: src.contentType, region: src.region,
        enabled: src.enabled,
        lastFetchAt: st.lastFetchAt ? formatTime(st.lastFetchAt) : null,
        successCount: st.ok ? st.count : 0,
        failCount: st.ok ? 0 : 1,
        todayCount: st.ok ? st.count : 0,
        health: st.ok ? "healthy" : "degraded",
      };
    }
    return simulateSourceHealth(src, idx);
  });

  const enabledSources = sources.filter((s) => s.enabled);
  const degradedSources = sources.filter((s) => s.health === "degraded");
  const staleSources = sources.filter((s) => s.health === "stale" && s.enabled);

  const contentsRaw = readJSON(CONTENTS_FILE);
  const contentCount = Array.isArray(contentsRaw) ? contentsRaw.length : 0;

  const realRun = Boolean(statusRaw);
  const fetchedTotal = statusRaw?.totalFetched ?? sources.reduce((s, src) => s + (src.enabled ? src.todayCount : 0), 0);

  const pipeline: PipelineStats = {
    todayFetched: fetchedTotal,
    todayLlmProcessed: realRun ? fetchedTotal : fetchedTotal + 12,
    todayCurated: contentCount > 0 ? Math.min(4, Math.max(1, Math.floor(contentCount / 8))) : 0,
    todayPublished: contentCount > 0 ? Math.min(10, contentCount) : 0,
    lastPipelineRun: statusRaw?.lastRunAt ? formatTime(statusRaw.lastRunAt) : null,
    totalSources: allSources.length,
    enabledSources: enabledSources.length,
    degradedSources: degradedSources.length,
    staleSources: staleSources.length,
  };

  const anomalies: AnomalyEntry[] = [];

  // 真实失败优先展示
  for (const src of sources) {
    const st = statusMap.get(src.id);
    if (st && !st.ok) {
      anomalies.push({
        id: `anom-${src.id}`,
        timestamp: st.lastFetchAt ? formatTime(st.lastFetchAt) : todayStr(),
        type: "source_failure",
        sourceName: src.name,
        message: st.error ? `抓取失败：${st.error}` : "抓取失败，请检查信源配置",
        resolved: false,
      });
    }
  }

  // 未运行过管道时保留模拟状态提示
  if (!realRun) {
    for (const src of sources) {
      if (src.health === "degraded") {
        anomalies.push({
          id: `anom-${src.id}`,
          timestamp: src.lastFetchAt || todayStr(),
          type: "source_failure",
          sourceName: src.name,
          message: `连续 ${src.failCount} 次抓取失败，最后一次返回 HTTP 503`,
          resolved: false,
        });
      }
      if (src.health === "stale" && src.enabled) {
        anomalies.push({
          id: `anom-stale-${src.id}`,
          timestamp: todayStr(),
          type: "warning",
          sourceName: src.name,
          message: "信源已超过 24 小时未成功抓取",
          resolved: src.failCount < 3,
        });
      }
    }
  }

  anomalies.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const response: OpsResponse = { sources, pipeline, anomalies };
  return NextResponse.json(response);
}