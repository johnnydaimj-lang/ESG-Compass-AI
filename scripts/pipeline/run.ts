import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContentItem } from "@/lib/contracts/content";
import type {
  HeatEvidence,
  HeatHistory,
  HeatPoint,
  PipelineStatus,
  PrefilterResult,
  PublicationBundle,
  RawMaterial,
  SourceRunStatus,
  SourceTier,
  StoryCluster,
} from "@/lib/contracts/pipeline";
import { PIPELINE_VERSION } from "@/lib/contracts/pipeline";
import { clusterMaterials, type ClusterInput } from "@/lib/pipeline/cluster";
import { classifyContentType } from "@/lib/pipeline/classify";
import { collectRssSource, sourceTierFor, type SourceConfig } from "@/lib/pipeline/collect";
import { buildDailyReport } from "@/lib/pipeline/daily";
import { calculateHeat } from "@/lib/pipeline/heat";
import { prefilterMaterial } from "@/lib/pipeline/prefilter";
import { promptVersion, promptVersions } from "@/lib/pipeline/prompt";
import { toPublishedItem, type ProcessedMaterial } from "@/lib/pipeline/publication";
import { decideSelection, recommendReasonFor, runHeuristicScores } from "@/lib/pipeline/score";
import { structureMaterial } from "@/lib/pipeline/structure";
import { cleanSummaryText, stableHash } from "@/lib/pipeline/text";
import { understandMaterial } from "@/lib/pipeline/understand";
import { readPublishedContents, writeDaily, writeHeatHistory, writePublicationBundle } from "@/lib/publication-store";

interface SourceFile {
  sources?: SourceConfig[];
}

type RunMode = "snapshot" | "live" | "llm";

// Prompt 文件参与版本哈希；顺序固定以便审计对比。
const PROMPT_NAMES = [
  "prefilter",
  "rules-esg",
  "safety",
  "selection-score",
  "content-understanding",
  "structure",
  "story-digest",
  "group-method",
  "group-definitions",
  "group-pair",
  "group-batch",
  "group-signal",
];

const root = process.cwd();
const legacyContentsFile = resolve(root, "data", "contents.json");
const sourcesFile = resolve(root, "data", "sources.json");
const mode = (process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] || "snapshot") as RunMode;
const preserveLegacySelection = !process.argv.includes("--no-preserve-selection");

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function findSource(item: ContentItem, sources: SourceConfig[]): SourceConfig | undefined {
  const byName = sources.find((source) => source.name === item.sourceName);
  if (byName) return byName;
  return sources.find((source) => source.url === item.sourceUrl);
}

// 未匹配到信源配置的材料仍需一个稳定来源标识，避免把材料 ID 当作信源 ID。
function fallbackSourceId(sourceName: string, sourceUrl: string): string {
  return `unmatched-${stableHash(`${sourceName}|${sourceUrl}`)}`;
}

function missingEnvKeys(source: SourceConfig): string[] {
  if (!source.requiresEnv) return [];
  return source.requiresEnv
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0 && !process.env[key]);
}

function buildMaterial(item: ContentItem, source: SourceConfig | undefined): RawMaterial {
  const sourceTier: SourceTier = source ? sourceTierFor(source) : "T2";
  const contentType = classifyContentType(item, source?.contentType || "观点");
  const content: ContentItem = {
    ...item,
    contentType,
    summary: cleanSummaryText(item.summary) || cleanSummaryText(item.title),
    summaryZh: cleanSummaryText(item.summaryZh) || cleanSummaryText(item.titleZh),
    recommendReason: item.recommendReason ? cleanSummaryText(item.recommendReason) : item.recommendReason,
  };
  return {
    id: item.id,
    sourceId: source ? source.id : fallbackSourceId(item.sourceName, item.sourceUrl),
    title: item.title,
    summary: content.summary,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    articleUrl: item.articleUrl,
    publishedAt: item.publishedAt,
    contentType,
    region: item.region,
    esgTopic: item.esgTopic,
    sourceTier,
    editorialSource: sourceTier !== "SIGNAL",
    legacyRecommended: Boolean(item.recommended),
    content,
  };
}

function materialsFromSnapshot(
  sources: SourceConfig[],
  warnings: string[],
): RawMaterial[] {
  let rawItems: ContentItem[] = readPublishedContents();
  if (rawItems.length === 0 && existsSync(legacyContentsFile)) {
    // 旧 data/contents.json 仅作为一次性迁移输入，不属于运行时事实源。
    rawItems = readJson<ContentItem[]>(legacyContentsFile, []);
  }

  const unmatched = new Set<string>();
  const materials = rawItems.map((item) => {
    const source = findSource(item, sources);
    if (!source && item.sourceName) unmatched.add(item.sourceName);
    return buildMaterial(item, source);
  });
  for (const name of unmatched) {
    warnings.push(`未匹配到信源配置，已使用临时来源标识：${name}`);
  }
  return materials;
}

function snapshotSourceRuns(
  sources: SourceConfig[],
  materials: RawMaterial[],
  startedAt: Date,
): SourceRunStatus[] {
  const counts = new Map<string, number>();
  for (const material of materials) {
    const id = material.sourceId || "unknown";
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return sources.map((source) => {
    const count = counts.get(source.id) || 0;
    return {
      id: source.id,
      name: source.name,
      type: source.type,
      state: source.enabled === false ? "skipped" : "ok",
      count,
      rawCount: count,
      error: "",
      warning: source.enabled === false ? "信源已停用" : "",
      channel: "snapshot",
      fallbackUsed: false,
      lastFetchAt: startedAt.toISOString(),
    } satisfies SourceRunStatus;
  });
}

async function liveSourceRuns(
  sources: SourceConfig[],
  warnings: string[],
  startedAt: Date,
): Promise<{ runs: SourceRunStatus[]; collected: RawMaterial[] }> {
  const runs: SourceRunStatus[] = [];
  const collected: RawMaterial[] = [];

  for (const source of sources) {
    const base = {
      id: source.id,
      name: source.name,
      type: source.type,
      lastFetchAt: startedAt.toISOString(),
    };

    if (source.enabled === false) {
      runs.push({ ...base, state: "skipped", count: 0, rawCount: 0, error: "", warning: "信源已停用", channel: "live", fallbackUsed: false });
      continue;
    }

    const missing = missingEnvKeys(source);
    if (missing.length > 0) {
      const warning = `缺少环境变量：${missing.join(", ")}`;
      runs.push({ ...base, state: "skipped", count: 0, rawCount: 0, error: "", warning, channel: "live", fallbackUsed: false });
      warnings.push(`${source.name} ${warning}`);
      continue;
    }

    if (source.type.toLowerCase() !== "rss") {
      const warning = `实时模式尚未实现 ${source.type} 适配器，本次沿用快照材料`;
      runs.push({ ...base, state: "skipped", count: 0, rawCount: 0, error: "", warning, channel: "live", fallbackUsed: false });
      warnings.push(`${source.name}：${warning}`);
      continue;
    }

    try {
      const items = await collectRssSource(source);
      collected.push(...items);
      runs.push({ ...base, state: "ok", count: items.length, rawCount: items.length, error: "", warning: "", channel: "rss", fallbackUsed: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runs.push({ ...base, state: "failed", count: 0, rawCount: 0, error: message, warning: "", channel: "rss", fallbackUsed: false });
      warnings.push(`${source.name} 抓取失败：${message}`);
    }
  }

  return { runs, collected };
}

async function acquireMaterials(
  sources: SourceConfig[],
  sourceRuns: SourceRunStatus[],
  warnings: string[],
  startedAt: Date,
): Promise<RawMaterial[]> {
  const snapshot = materialsFromSnapshot(sources, warnings);

  if (mode !== "live") {
    sourceRuns.push(...snapshotSourceRuns(sources, snapshot, startedAt));
    return snapshot;
  }

  const { runs, collected } = await liveSourceRuns(sources, warnings, startedAt);
  sourceRuns.push(...runs);

  // 实时结果优先，快照材料补齐尚未实现适配器的信源，避免公开内容在切换时消失。
  const byId = new Map<string, RawMaterial>();
  for (const material of snapshot) byId.set(material.id, material);
  for (const material of collected) {
    const existing = byId.get(material.id);
    if (existing) {
      // 同一条材料再次被抓取时，保留快照里已翻译的中文标题与摘要。
      material.content.titleZh = existing.content.titleZh || material.content.titleZh;
      material.content.summaryZh = existing.content.summaryZh || material.content.summaryZh;
    }
    byId.set(material.id, material);
  }
  return [...byId.values()];
}

async function main() {
  const startedAt = new Date();
  const sourceConfig = readJson<SourceFile>(sourcesFile, { sources: [] });
  const sources = (sourceConfig.sources || []).filter((source): source is SourceConfig => Boolean(source && source.id));
  const warnings: string[] = [];
  const sourceRuns: SourceRunStatus[] = [];

  const rawMaterials = await acquireMaterials(sources, sourceRuns, warnings, startedAt);

  const processed: ProcessedMaterial[] = [];
  let blocked = 0;
  let unknown = 0;

  for (const material of rawMaterials) {
    const prefilter: PrefilterResult = prefilterMaterial(material);
    if (prefilter.label === "BLOCK") {
      blocked += 1;
      continue;
    }
    if (prefilter.label === "UNKNOWN") unknown += 1;

    const sourceTier = material.sourceTier || "T2";
    const runs = runHeuristicScores(material, sourceTier);
    const decision = decideSelection(runs, sourceTier);
    const understanding = understandMaterial(material, sourceTier);
    understanding.editorialJudgment = recommendReasonFor(material, decision);
    const fact = structureMaterial(material);
    processed.push({
      material,
      sourceTier,
      prefilter,
      decision,
      understanding,
      fact,
      legacySelected: Boolean(material.legacyRecommended),
    });
  }

  const clusterInputs: ClusterInput[] = processed.map((entry) => ({
    material: entry.material,
    sourceId: entry.material.sourceId || fallbackSourceId(entry.material.sourceName, entry.material.sourceUrl),
    sourceTier: entry.sourceTier,
    editorialSource: Boolean(entry.material.editorialSource),
    fact: entry.fact,
  }));
  const clusters: StoryCluster[] = clusterMaterials(clusterInputs);
  const clusterByMember = new Map<string, StoryCluster>();
  const clusterEvidence = new Map<string, HeatEvidence[]>();
  for (const cluster of clusters) {
    for (const memberId of cluster.memberIds) clusterByMember.set(memberId, cluster);
    const evidence = processed
      .filter((entry) => cluster.memberIds.includes(entry.material.id))
      .map((entry) => ({
        sourceId: entry.material.sourceId || fallbackSourceId(entry.material.sourceName, entry.material.sourceUrl),
        sourceTier: entry.sourceTier,
        publishedAt: entry.material.publishedAt,
        editorialSource: Boolean(entry.material.editorialSource),
      }));
    clusterEvidence.set(cluster.id, evidence);
    const heat = calculateHeat(evidence, startedAt);
    cluster.heat = heat.score;
    cluster.heat6hAgo = heat.heat6hAgo;
    cluster.trend = heat.trend;
    cluster.trendPct = heat.trendPct;
    cluster.badges = heat.badges;
    cluster.signalCount = heat.signalParticipants;
    const sourceNameBySourceId = new Map<string, string>();
    for (const entry of processed) {
      if (cluster.memberIds.includes(entry.material.id)) {
        sourceNameBySourceId.set(
          entry.material.sourceId || fallbackSourceId(entry.material.sourceName, entry.material.sourceUrl),
          entry.material.sourceName,
        );
      }
    }
    cluster.sourceNames = [...new Set(cluster.participants.map((id) => sourceNameBySourceId.get(id) || id))];
  }

  const contentPromptVersion = promptVersion(["content-understanding", "structure", "selection-score"]);
  const contents = processed
    .map((entry) => {
      const cluster = clusterByMember.get(entry.material.id);
      if (!cluster) return null;
      return toPublishedItem(entry, cluster, { preserveLegacySelection, promptVersion: contentPromptVersion });
    })
    .filter((item): item is ContentItem => Boolean(item))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const hotspots = clusters
    .filter((cluster) => cluster.heat > 0)
    .sort((a, b) => b.heat - a.heat || b.latestPublishedAt.localeCompare(a.latestPublishedAt))
    .slice(0, 30);

  if (mode === "llm") {
    warnings.push("未配置模型执行器，本次使用确定性评分适配器；Prompt 由 prompts/ 版本化管理。");
  }
  if (mode === "live") {
    warnings.push("实时模式仅对已实现的 RSS 适配器联网，其余信源沿用快照材料。");
  }

  const finishedAt = new Date();
  const status: PipelineStatus = {
    pipelineVersion: PIPELINE_VERSION,
    command: "npm run pipeline",
    mode,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    rawCount: rawMaterials.length,
    passedPrefilter: processed.length,
    blockedPrefilter: blocked,
    unknownPrefilter: unknown,
    scoredCount: processed.length,
    selectedCount: contents.filter((item) => item.recommended).length,
    storyCount: clusters.length,
    hotStoryCount: hotspots.length,
    sourceCount: sources.length,
    warnings,
    sourceRuns,
    promptVersions: promptVersions(PROMPT_NAMES),
  };

  const bundle: PublicationBundle = {
    version: PIPELINE_VERSION,
    generatedAt: finishedAt.toISOString(),
    contents,
    stories: clusters,
    hotspots,
    status,
  };

  const heatHistoryStories: Record<string, HeatPoint[]> = {};
  for (const cluster of clusters) {
    if (cluster.participants.length < 2) continue;
    const evidence = clusterEvidence.get(cluster.id) || [];
    const points: HeatPoint[] = [];
    for (let offsetHours = 48; offsetHours >= 0; offsetHours -= 1) {
      const at = new Date(startedAt.getTime() - offsetHours * 3_600_000);
      const heatAt = calculateHeat(evidence, at);
      points.push({ hour: at.toISOString(), heat: heatAt.score, participants: heatAt.participants });
    }
    heatHistoryStories[cluster.id] = points;
  }

  writePublicationBundle(bundle);
  writeDaily(buildDailyReport(contents, clusters, finishedAt));
  writeHeatHistory({ generatedAt: finishedAt.toISOString(), stories: heatHistoryStories });

  process.stdout.write(
    `ESG Compass v2 pipeline (${mode})\n`
    + `raw=${status.rawCount} published=${contents.length} selected=${status.selectedCount} `
    + `stories=${status.storyCount} hotspots=${status.hotStoryCount}\n`,
  );
  if (warnings.length) process.stdout.write(`warnings=${warnings.join(" | ")}\n`);
}

main().catch((error) => {
  process.stderr.write(`[pipeline] failed: ${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
