// 每周信源健康检查：读取 sources.json 与最近一次 pipeline 状态，输出异常与待配置清单。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SourceRunStatus } from "@/lib/contracts/pipeline";
import { readPipelineStatus } from "@/lib/publication-store";

interface SourceEntry {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled?: boolean;
  requiresEnv?: string;
  fallbacks?: unknown[];
}

type Health = "healthy" | "idle" | "degraded" | "stale" | "skipped" | "disabled" | "unrun";

const SOURCES_FILE = resolve(process.cwd(), "data", "sources.json");
const REPORT_FILE = resolve(process.cwd(), "data", "source-health.json");
const STALE_DAYS = 7;

function readSources(): SourceEntry[] {
  if (!existsSync(SOURCES_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(SOURCES_FILE, "utf8")) as { sources?: SourceEntry[] };
    return raw?.sources ?? [];
  } catch {
    return [];
  }
}

function missingEnvKeys(source: SourceEntry): string[] {
  if (!source.requiresEnv) return [];
  return source.requiresEnv
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0 && !process.env[key]);
}

function classify(
  source: SourceEntry,
  run: SourceRunStatus | undefined,
  pipelineStale: boolean
): { health: Health; reason: string } {
  if (source.enabled === false) return { health: "disabled", reason: "信源已停用" };

  const missing = missingEnvKeys(source);
  const hasFallbacks = Array.isArray(source.fallbacks) && source.fallbacks.length > 0;
  if (missing.length > 0 && !hasFallbacks) {
    return { health: "skipped", reason: `缺少环境变量：${missing.join(", ")}` };
  }
  if (!run) return { health: "unrun", reason: "尚未进入最近一次 pipeline 运行" };
  if (run.state === "skipped") {
    return { health: "skipped", reason: run.warning || run.error || "本次运行已跳过" };
  }
  if (run.state === "failed") {
    return { health: "degraded", reason: run.error || "抓取失败" };
  }
  if (run.count === 0) {
    return {
      health: "idle",
      reason: run.rawCount > 0 ? "窗口内无新增内容" : "已正常抓取，当前无更新",
    };
  }
  if (pipelineStale) return { health: "stale", reason: `最近一次成功运行已超过 ${STALE_DAYS} 天` };
  return {
    health: "healthy",
    reason: run.warning || (run.fallbackUsed ? "已由备用通道完成抓取" : "最近一次抓取正常"),
  };
}

function main() {
  const sources = readSources();
  const status = readPipelineStatus();
  const runMap = new Map((status?.sourceRuns ?? []).map((run) => [run.id, run]));
  const lastRunMs = status?.finishedAt ? Date.parse(status.finishedAt) : NaN;
  const pipelineStale = Number.isFinite(lastRunMs) && Date.now() - lastRunMs > STALE_DAYS * 24 * 3_600_000;

  const rows = sources.map((source) => {
    const run = runMap.get(source.id);
    const { health, reason } = classify(source, run, pipelineStale);
    return {
      id: source.id,
      name: source.name,
      type: source.type,
      enabled: source.enabled !== false,
      health,
      reason,
      count: run?.count ?? 0,
      lastFetchAt: run?.lastFetchAt ?? null,
      channel: run?.channel ?? "",
    };
  });

  const summary = {
    total: rows.length,
    enabled: rows.filter((row) => row.enabled).length,
    healthy: rows.filter((row) => row.health === "healthy").length,
    idle: rows.filter((row) => row.health === "idle").length,
    degraded: rows.filter((row) => row.health === "degraded").length,
    skipped: rows.filter((row) => row.health === "skipped").length,
    unrun: rows.filter((row) => row.health === "unrun").length,
    stale: rows.filter((row) => row.health === "stale").length,
    disabled: rows.filter((row) => row.health === "disabled").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    pipelineFinishedAt: status?.finishedAt ?? null,
    summary,
    sources: rows,
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n", "utf8");

  process.stdout.write(
    `ESG Compass 信源健康检查 (${new Date().toISOString().slice(0, 10)})\n`
    + `总信源 ${summary.total} | 启用 ${summary.enabled} | 正常 ${summary.healthy} | 无更新 ${summary.idle} `
    + `| 异常 ${summary.degraded} | 待配置 ${summary.skipped} | 未运行 ${summary.unrun} `
    + `| 过期 ${summary.stale} | 停用 ${summary.disabled}\n`
  );

  const degraded = rows.filter((row) => row.health === "degraded");
  if (degraded.length > 0) {
    process.stdout.write("\n--- 异常信源 ---\n");
    for (const row of degraded) process.stdout.write(`- ${row.name} (${row.id})：${row.reason}\n`);
  }

  const skipped = rows.filter((row) => row.health === "skipped");
  if (skipped.length > 0) {
    process.stdout.write("\n--- 待配置/未实现适配器 ---\n");
    for (const row of skipped.slice(0, 30)) {
      process.stdout.write(`- ${row.name} (${row.id})：${row.reason}\n`);
    }
    if (skipped.length > 30) process.stdout.write(`… 另有 ${skipped.length - 30} 条\n`);
  }

  const stale = rows.filter((row) => row.health === "stale");
  if (stale.length > 0) {
    process.stdout.write("\n--- 过期信源 ---\n");
    for (const row of stale) process.stdout.write(`- ${row.name} (${row.id})：${row.reason}\n`);
  }

  process.stdout.write(`\n报告已写入 data/source-health.json\n`);
  if (summary.degraded > 0) process.exitCode = 1;
}

main();

export {};
