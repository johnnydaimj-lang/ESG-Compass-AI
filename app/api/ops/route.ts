import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isAdmin } from "@/lib/admin-auth";
import { readPipelineStatus, readPublishedContents } from "@/lib/publication-store";
import type { SourceRunStatus } from "@/lib/contracts/pipeline";

const SOURCES_FILE = resolve(process.cwd(), "data", "sources.json");

// ── 类型 ──────────────────────────────────────────────
interface SourceEntry {
  id: string; name: string; url: string; type: string; contentType: string;
  region: string; language: string; enabled: boolean; notes?: string; rssUrl?: string;
  requiresEnv?: string; fallbacks?: unknown[];
}
interface SourceHealth {
  id: string; name: string; type: string; contentType: string; region: string;
  enabled: boolean; lastFetchAt: string | null; successCount: number;
  failCount: number; todayCount: number;
  health: "healthy" | "idle" | "degraded" | "stale" | "skipped" | "disabled" | "unrun";
  runStatus: "ok" | "failed" | "skipped" | "disabled" | "unrun";
  reason: string; channel: string; fallbackUsed: boolean;
}
interface PipelineStats {
  todayFetched: number; todayLlmProcessed: number; todayCurated: number;
  todayPublished: number; lastPipelineRun: string | null;
  backfillFrom: string | null;
  totalSources: number; enabledSources: number; readySources: number; skippedSources: number;
  degradedSources: number; idleSources: number;
  staleSources: number; passedQuality: number | null; filteredQuality: number | null;
}
interface AnomalyEntry {
  id: string; timestamp: string;
  type: "source_failure" | "config_missing" | "llm_error" | "network_error" | "warning";
  sourceName: string; message: string; resolved: boolean;
}
interface OpsResponse {
  sources: SourceHealth[];
  pipeline: PipelineStats;
  anomalies: AnomalyEntry[];
}

// ── 工具 ──────────────────────────────────────────────
function readSources(): SourceEntry[] {
  try {
    if (!existsSync(SOURCES_FILE)) return [];
    const raw = JSON.parse(readFileSync(SOURCES_FILE, "utf-8")) as { sources?: SourceEntry[] };
    return raw?.sources ?? [];
  } catch {
    return [];
  }
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

function missingEnvKeys(source: SourceEntry): string[] {
  if (!source.requiresEnv) return [];
  return source.requiresEnv.split(",").map((key) => key.trim()).filter((key) => key && !process.env[key]);
}

function buildSourceHealth(
  source: SourceEntry,
  run: SourceRunStatus | undefined,
  pipelineIsStale: boolean,
): SourceHealth {
  const base = {
    id: source.id,
    name: source.name,
    type: source.type,
    contentType: source.contentType,
    region: source.region,
    enabled: source.enabled,
    lastFetchAt: run?.lastFetchAt ? formatTime(run.lastFetchAt) : null,
    successCount: run?.state === "ok" ? run.count : 0,
    failCount: run?.state === "failed" ? 1 : 0,
    todayCount: run?.state === "ok" ? run.count : 0,
    channel: run?.channel || "",
    fallbackUsed: Boolean(run?.fallbackUsed),
  };

  if (!source.enabled) {
    return { ...base, health: "disabled", runStatus: "disabled", reason: "信源已停用" };
  }
  const missing = missingEnvKeys(source);
  const hasFallbacks = Array.isArray(source.fallbacks) && source.fallbacks.length > 0;
  if (missing.length > 0 && !hasFallbacks) {
    return {
      ...base,
      health: "skipped",
      runStatus: "skipped",
      reason: `缺少环境变量：${missing.join(", ")}`,
    };
  }
  if (!run) {
    return { ...base, health: "unrun", runStatus: "unrun", reason: "尚未进入最近一次管道运行" };
  }
  if (run.state === "skipped") {
    return { ...base, health: "skipped", runStatus: "skipped", reason: run.warning || run.error || "本次运行已跳过" };
  }
  if (run.state === "failed") {
    return { ...base, health: "degraded", runStatus: "failed", reason: run.error || "抓取失败" };
  }
  if (run.count === 0) {
    return {
      ...base,
      health: "idle",
      runStatus: "ok",
      reason: run.rawCount > 0 ? "窗口内无新增内容" : "已正常抓取，当前无更新",
    };
  }
  if (pipelineIsStale) {
    return { ...base, health: "stale", runStatus: "ok", reason: "最近一次成功运行已超过 24 小时" };
  }
  return {
    ...base,
    health: "healthy",
    runStatus: "ok",
    reason: run.warning || (run.fallbackUsed ? "已由备用通道完成抓取" : "最近一次抓取正常"),
  };
}

// ── 主路由 ────────────────────────────────────────────
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const allSources = readSources();
  const status = readPipelineStatus();
  const statusMap = new Map((status?.sourceRuns ?? []).map((run) => [run.id, run]));

  const lastRunAt = status?.finishedAt ? new Date(status.finishedAt) : null;
  const pipelineIsStale = Boolean(lastRunAt && !Number.isNaN(lastRunAt.getTime()) && Date.now() - lastRunAt.getTime() > 24 * 3600 * 1000);
  const sources: SourceHealth[] = allSources.map((src) =>
    buildSourceHealth(src, statusMap.get(src.id), pipelineIsStale)
  );

  const enabledSources = sources.filter((s) => s.enabled);
  const readySources = enabledSources.filter((s) => s.runStatus !== "skipped" && s.runStatus !== "unrun");
  const skippedSources = sources.filter((s) => s.health === "skipped");
  const degradedSources = sources.filter((s) => s.health === "degraded");
  const idleSources = sources.filter((s) => s.health === "idle");
  const staleSources = sources.filter((s) => s.health === "stale" && s.enabled);

  const contents = readPublishedContents();
  const curatedCount = contents.filter((item) => Boolean(item.recommended)).length;
  const passedQuality = status?.passedPrefilter ?? null;
  const filteredQuality = status?.blockedPrefilter ?? null;

  const pipeline: PipelineStats = {
    todayFetched: status?.rawCount ?? 0,
    todayLlmProcessed: status?.scoredCount ?? 0,
    todayCurated: curatedCount,
    todayPublished: contents.length,
    lastPipelineRun: status?.finishedAt ? formatTime(status.finishedAt) : null,
    backfillFrom: null,
    totalSources: allSources.length,
    enabledSources: enabledSources.length,
    readySources: readySources.length,
    skippedSources: skippedSources.length,
    degradedSources: degradedSources.length,
    idleSources: idleSources.length,
    staleSources: staleSources.length,
    passedQuality,
    filteredQuality,
  };

  const anomalies: AnomalyEntry[] = [];

  for (const src of sources) {
    const run = statusMap.get(src.id);
    if (src.health === "degraded") {
      anomalies.push({
        id: `anom-${src.id}`,
        timestamp: run?.lastFetchAt ? formatTime(run.lastFetchAt) : todayStr(),
        type: "source_failure",
        sourceName: src.name,
        message: run?.error ? `抓取失败：${run.error}` : "抓取失败，请检查信源配置",
        resolved: false,
      });
    } else if (src.health === "skipped") {
      anomalies.push({
        id: `anom-skipped-${src.id}`,
        timestamp: todayStr(),
        type: "config_missing",
        sourceName: src.name,
        message: src.reason,
        resolved: false,
      });
    } else if (src.health === "unrun") {
      anomalies.push({
        id: `anom-unrun-${src.id}`,
        timestamp: todayStr(),
        type: "warning",
        sourceName: src.name,
        message: src.reason,
        resolved: false,
      });
    } else if (src.health === "stale") {
      anomalies.push({
        id: `anom-stale-${src.id}`,
        timestamp: src.lastFetchAt || todayStr(),
        type: "warning",
        sourceName: src.name,
        message: src.reason,
        resolved: false,
      });
    } else if (run?.fallbackUsed && run.warning) {
      anomalies.push({
        id: `anom-fallback-${src.id}`,
        timestamp: run.lastFetchAt ? formatTime(run.lastFetchAt) : todayStr(),
        type: "warning",
        sourceName: src.name,
        message: run.warning,
        resolved: true,
      });
    }
  }

  anomalies.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const response: OpsResponse = { sources, pipeline, anomalies };
  return NextResponse.json(response);
}
