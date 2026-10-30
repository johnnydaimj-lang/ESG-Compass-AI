import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  CONTENT_SIGNAL_SCHEMA_VERSION,
  type ContentOpsLatestIndex,
  type ContentSignal,
  type ContentSignalPriority,
  type ContentSignalStatus,
  type SignalCursor,
} from "@/lib/content-ops/types";

const PRIORITY_ORDER: Record<ContentSignalPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

function ensureDirectory(path: string): void {
  mkdirSync(path, { recursive: true });
}

function writeJsonAtomic(path: string, value: unknown): void {
  ensureDirectory(dirname(path));
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
  try {
    renameSync(temporary, path);
  } catch {
    writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
  }
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function contentOpsRoot(root = process.cwd()): string {
  return resolve(root, "data", "content-ops");
}

export function contentOpsPaths(root = process.cwd()) {
  const base = contentOpsRoot(root);
  return {
    base,
    signals: resolve(base, "signals"),
    briefs: resolve(base, "briefs"),
    alerts: resolve(base, "alerts"),
    topics: resolve(base, "topics"),
    drafts: resolve(base, "drafts"),
    reviews: resolve(base, "reviews"),
    published: resolve(base, "published"),
    state: resolve(base, "state"),
    schemas: resolve(base, "schemas"),
    latest: resolve(base, "latest.json"),
    board: resolve(base, "board.md"),
  };
}

export function ensureContentOpsDirectories(root = process.cwd()): void {
  const paths = contentOpsPaths(root);
  for (const path of [
    paths.base,
    paths.signals,
    paths.briefs,
    paths.alerts,
    paths.topics,
    paths.drafts,
    paths.reviews,
    paths.published,
    paths.state,
    paths.schemas,
  ]) {
    ensureDirectory(path);
  }
}

export function chinaDateKey(value: string | Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`无效日期：${String(value)}`);
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function signalIdFor(parts: {
  title: string;
  sourceUrl: string;
  publishedAt: string;
  recordId: string;
}): string {
  return `sig-${createHash("sha256")
    .update(`${parts.recordId}|${parts.title}|${parts.sourceUrl}|${parts.publishedAt}`)
    .digest("hex")
    .slice(0, 16)}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isIsoDateOrDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && Number.isFinite(Date.parse(value));
}

function isUnitScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateContentSignal(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return ["signal 必须是对象"];
  const signal = value as Partial<ContentSignal>;

  if (signal.schemaVersion !== CONTENT_SIGNAL_SCHEMA_VERSION) errors.push("schemaVersion 不匹配");
  if (!/^sig-[a-f0-9]{16}$/.test(String(signal.signalId || ""))) errors.push("signalId 格式无效");
  if (!signal.detectedAt || !isIsoDateOrDateTime(signal.detectedAt)) errors.push("detectedAt 必须是 ISO 日期时间");
  if (!signal.title?.trim()) errors.push("title 不能为空");
  if (!signal.fact?.trim()) errors.push("fact 不能为空");
  if (!signal.sourceName?.trim()) errors.push("sourceName 不能为空");
  if (!signal.sourceUrl || !isHttpUrl(signal.sourceUrl)) errors.push("sourceUrl 必须是 HTTP(S) 地址");
  if (!signal.publishedAt || !isIsoDateOrDateTime(signal.publishedAt)) errors.push("publishedAt 格式无效");
  if (!signal.region?.trim()) errors.push("region 不能为空");
  if (!signal.whyItMatters?.trim()) errors.push("whyItMatters 不能为空");
  if (!["policy", "research", "hotspot", "market", "corporate", "other"].includes(String(signal.category))) {
    errors.push("category 无效");
  }
  if (!Array.isArray(signal.potentialAngles)) errors.push("potentialAngles 必须是数组");
  if (!Array.isArray(signal.watchpoints)) errors.push("watchpoints 必须是数组");
  if (!Array.isArray(signal.stakeholders)) errors.push("stakeholders 必须是数组");
  if (!Array.isArray(signal.tags)) errors.push("tags 必须是数组");
  if (!Array.isArray(signal.evidence) || signal.evidence.length === 0) errors.push("evidence 至少需要一条");
  if (!isUnitScore(signal.novelty)) errors.push("novelty 必须是 0-1 数值");
  if (!isUnitScore(signal.materiality)) errors.push("materiality 必须是 0-1 数值");
  if (!isUnitScore(signal.durability)) errors.push("durability 必须是 0-1 数值");
  if (!isUnitScore(signal.evidenceCompleteness)) errors.push("evidenceCompleteness 必须是 0-1 数值");
  if (!["P0", "P1", "P2"].includes(String(signal.priority))) errors.push("priority 无效");
  if (!["ready", "needs_evidence", "blocked"].includes(String(signal.status))) errors.push("status 无效");
  if (!["A", "B", "C"].includes(String(signal.sourceGrade))) errors.push("sourceGrade 无效");
  if (typeof signal.isPrimarySource !== "boolean") errors.push("isPrimarySource 必须是布尔值");
  if (
    ["A", "B", "C"].includes(String(signal.sourceGrade)) &&
    typeof signal.isPrimarySource === "boolean" &&
    (signal.sourceGrade === "A") !== signal.isPrimarySource
  ) {
    errors.push("sourceGrade=A 与 isPrimarySource=true 必须一致");
  }
  if (!signal.provenance || signal.provenance.producer !== "employee-1-content-scout") {
    errors.push("provenance.producer 必须是 employee-1-content-scout");
  }

  if (Array.isArray(signal.evidence)) {
    if (
      signal.sourceUrl &&
      !signal.evidence.some((item) => item && typeof item === "object" && item.sourceUrl === signal.sourceUrl)
    ) {
      errors.push("evidence 必须包含交接来源 sourceUrl");
    }
    signal.evidence.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`evidence[${index}] 必须是对象`);
        return;
      }
      if (!item.id?.trim()) errors.push(`evidence[${index}].id 不能为空`);
      if (!item.sourceName?.trim()) errors.push(`evidence[${index}].sourceName 不能为空`);
      if (!item.sourceUrl || !isHttpUrl(item.sourceUrl)) errors.push(`evidence[${index}].sourceUrl 无效`);
      if (!item.publishedAt || !isIsoDateOrDateTime(item.publishedAt)) errors.push(`evidence[${index}].publishedAt 无效`);
      if (!["A", "B", "C"].includes(String(item.sourceGrade))) errors.push(`evidence[${index}].sourceGrade 无效`);
      if (!item.claim?.trim()) errors.push(`evidence[${index}].claim 不能为空`);
      if (!["verified", "revise", "blocked"].includes(String(item.status))) errors.push(`evidence[${index}].status 无效`);
    });
  }

  return errors;
}

function readJsonLines<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });
}

function signalFilePath(root: string, detectedAt: string): string {
  return resolve(contentOpsPaths(root).signals, `${chinaDateKey(detectedAt)}.jsonl`);
}

function allSignalFiles(root: string): string[] {
  const directory = contentOpsPaths(root).signals;
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
    .sort()
    .map((name) => resolve(directory, name));
}

export function readAllContentSignals(root = process.cwd()): ContentSignal[] {
  return allSignalFiles(root).flatMap((path) => readJsonLines<ContentSignal>(path));
}

export function readLatestIndex(root = process.cwd()): ContentOpsLatestIndex | null {
  return readJson<ContentOpsLatestIndex | null>(contentOpsPaths(root).latest, null);
}

function markdownSignalList(signals: ContentSignal[]): string {
  if (signals.length === 0) return "_暂无信号。_\n";
  return signals
    .slice()
    .sort((left, right) => {
      return PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]
        || right.materiality - left.materiality
        || right.detectedAt.localeCompare(left.detectedAt);
    })
    .map((signal) => {
      const source = `[${signal.sourceName}](${signal.sourceUrl})`;
      const evidence = signal.sourceGrade === "A" ? "一手来源" : "待补一手来源";
      return [
        `### ${signal.priority} · ${signal.title}`,
        "",
        `- 信号：\`${signal.signalId}\` · ${signal.status} · ${evidence}`,
        `- 事实：${signal.fact}`,
        `- 为什么值得关注：${signal.whyItMatters}`,
        `- 来源：${source} · 发布 ${signal.publishedAt}`,
        `- 观察点：${signal.watchpoints.length ? signal.watchpoints.join("；") : "待研究编辑补充"}`,
        "",
      ].join("\n");
    })
    .join("\n");
}

function buildBrief(date: string, signals: ContentSignal[]): string {
  return [
    `# 内容信号简报 · ${date}`,
    "",
    "> 由员工 1 号【内容筛选者】生成。`事实` 字段只来自已有来源；`为什么值得关注` 和 `观察点` 属于编辑提示，必须由员工 2 号重新核查。",
    "",
    `本日新增 ${signals.length} 条信号。`,
    "",
    markdownSignalList(signals),
  ].join("\n");
}

function buildBoard(signals: ContentSignal[], updatedAt: string): string {
  const counts = signals.reduce(
    (result, signal) => {
      result[signal.priority] += 1;
      return result;
    },
    { P0: 0, P1: 0, P2: 0 } as Record<ContentSignalPriority, number>,
  );
  const statusCounts = signals.reduce(
    (result, signal) => {
      result[signal.status] += 1;
      return result;
    },
    { ready: 0, needs_evidence: 0, blocked: 0 } as Record<ContentSignalStatus, number>,
  );
  return [
    "# 内容协同看板",
    "",
    `更新时间：${updatedAt}`,
    "",
    "## 1 号员工信号池",
    "",
    `- 总信号：${signals.length}`,
    `- P0 / P1 / P2：${counts.P0} / ${counts.P1} / ${counts.P2}`,
    `- ready / needs_evidence / blocked：${statusCounts.ready} / ${statusCounts.needs_evidence} / ${statusCounts.blocked}`,
    "",
    "## 最近信号",
    "",
    "| 优先级 | 信号 | 标题 | 来源等级 | 状态 |",
    "| --- | --- | --- | --- | --- |",
    ...signals
      .slice()
      .sort((left, right) => right.detectedAt.localeCompare(left.detectedAt))
      .slice(0, 30)
      .map((signal) => `| ${signal.priority} | \`${signal.signalId}\` | ${signal.title.replace(/\|/g, "\\|")} | ${signal.sourceGrade} | ${signal.status} |`),
    "",
    "## 2 号员工交接位",
    "",
    "- 候选选题：`data/content-ops/topics/`",
    "- 初稿与证据表：`data/content-ops/drafts/`",
    "- 待 Johnny 润色/终审：`data/content-ops/reviews/`",
    "- 未经人工审核的内容不得进入发布链路。",
    "",
  ].join("\n");
}

export interface AppendSignalsResult {
  added: number;
  skipped: number;
  dryRun: boolean;
  signalFile: string;
  briefFile: string;
  alertFile: string;
  boardFile: string;
}

export function appendContentSignals(
  signals: ContentSignal[],
  options: { root?: string; detectedAt?: string; dryRun?: boolean } = {},
): AppendSignalsResult {
  const root = options.root || process.cwd();
  const paths = contentOpsPaths(root);
  const dryRun = options.dryRun === true;

  if (signals.length === 0) {
    throw new Error("没有可写入的 content signal");
  }
  const detectedAt = options.detectedAt || signals[0].detectedAt;
  const date = chinaDateKey(detectedAt);
  const signalFile = signalFilePath(root, detectedAt);
  const previous = readAllContentSignals(root);
  const previousIds = new Set(previous.map((signal) => signal.signalId));
  const newSignals = signals.filter((signal) => {
    const errors = validateContentSignal(signal);
    if (errors.length > 0) {
      throw new Error(`信号 ${signal.signalId || "(unknown)"} 校验失败：${errors.join("；")}`);
    }
    if (previousIds.has(signal.signalId)) return false;
    previousIds.add(signal.signalId);
    return true;
  });

  if (dryRun) {
    return {
      added: newSignals.length,
      skipped: signals.length - newSignals.length,
      dryRun: true,
      signalFile,
      briefFile: resolve(paths.briefs, `${date}.md`),
      alertFile: resolve(paths.alerts, `${date}.md`),
      boardFile: paths.board,
    };
  }

  ensureContentOpsDirectories(root);
  if (newSignals.length > 0) {
    const content = newSignals.map((signal) => JSON.stringify(signal)).join("\n") + "\n";
    appendFileSync(signalFile, content, "utf8");
  }

  const allSignals = readAllContentSignals(root);
  const counts = allSignals.reduce(
    (result, signal) => {
      result[signal.priority] += 1;
      return result;
    },
    { P0: 0, P1: 0, P2: 0 } as Record<ContentSignalPriority, number>,
  );
  const latestIndex: ContentOpsLatestIndex = {
    schemaVersion: CONTENT_SIGNAL_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    signalFile: signalFile,
    totalSignals: allSignals.length,
    readySignals: allSignals.filter((signal) => signal.status === "ready").length,
    needsEvidenceSignals: allSignals.filter((signal) => signal.status === "needs_evidence").length,
    priorityCounts: counts,
    latestSignals: allSignals.slice(-30),
  };
  writeJsonAtomic(paths.latest, latestIndex);

  const todaySignals = allSignals.filter((signal) => chinaDateKey(signal.detectedAt) === date);
  const briefFile = resolve(paths.briefs, `${date}.md`);
  writeFileSync(briefFile, buildBrief(date, todaySignals), "utf8");

  const urgentSignals = todaySignals.filter((signal) => signal.priority === "P0" || signal.priority === "P1");
  const alertFile = resolve(paths.alerts, `${date}.md`);
  writeFileSync(
    alertFile,
    urgentSignals.length > 0 ? buildBrief(`${date} · 立即关注`, urgentSignals) : `# 内容告警 · ${date}\n\n今日没有 P0/P1 信号。\n`,
    "utf8",
  );

  const boardFile = paths.board;
  writeFileSync(boardFile, buildBoard(allSignals, new Date().toISOString()), "utf8");

  return {
    added: newSignals.length,
    skipped: signals.length - newSignals.length,
    dryRun: false,
    signalFile,
    briefFile,
    alertFile,
    boardFile,
  };
}

export function readCursor(root: string, consumer: string): SignalCursor | null {
  return readJson<SignalCursor | null>(
    resolve(contentOpsPaths(root).state, `${consumer}.cursor.json`),
    null,
  );
}

export function writeCursor(root: string, cursor: SignalCursor): void {
  writeJsonAtomic(
    resolve(contentOpsPaths(root).state, `${cursor.consumer}.cursor.json`),
    cursor,
  );
}

export function readNewContentSignals(
  options: { root?: string; consumer?: string; updateCursor?: boolean; limit?: number } = {},
): { signals: ContentSignal[]; cursor: SignalCursor; cursorFound: boolean } {
  const root = options.root || process.cwd();
  const consumer = options.consumer || "employee-2";
  const previous = readCursor(root, consumer);
  const files = allSignalFiles(root);
  const previousPositions = previous?.positions || {};
  const records: Array<{
    signal: ContentSignal;
    file: string;
    endOffset: number;
  }> = [];
  const scannedThrough: Record<string, number> = {};

  for (const path of files) {
    const file = basename(path);
    const content = readFileSync(path);
    const requestedOffset = previousPositions[file] || 0;
    const startOffset =
      Number.isInteger(requestedOffset) && requestedOffset >= 0 && requestedOffset <= content.length
        ? requestedOffset
        : 0;
    const pending = content.subarray(startOffset);
    scannedThrough[file] = startOffset + pending.length;
    let lineStart = 0;

    while (lineStart < pending.length) {
      const lineEnd = pending.indexOf(0x0a, lineStart);
      const completeLine = lineEnd >= 0;
      const rawLine = pending
        .subarray(lineStart, completeLine ? lineEnd : pending.length)
        .toString("utf8")
        .replace(/\r$/, "")
        .trim();
      const endOffset = startOffset + (completeLine ? lineEnd + 1 : pending.length);

      if (rawLine) {
        try {
          records.push({
            signal: JSON.parse(rawLine) as ContentSignal,
            file,
            endOffset,
          });
        } catch {
          // Invalid historical lines are skipped but still count as consumed.
        }
      }

      if (!completeLine) break;
      lineStart = lineEnd + 1;
    }
  }

  const limit =
    typeof options.limit === "number" && Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : undefined;
  const selected = limit ? records.slice(0, limit) : records;
  const positions = { ...previousPositions };
  const lastSelected = selected.at(-1);
  if (!lastSelected) {
    Object.assign(positions, scannedThrough);
  } else {
    for (const path of files) {
      const file = basename(path);
      positions[file] = scannedThrough[file] || 0;
      if (file === lastSelected.file) {
        positions[file] = lastSelected.endOffset;
        break;
      }
    }
  }
  const last = selected.at(-1)?.signal;
  const cursor: SignalCursor = {
    version: 1,
    consumer,
    updatedAt: new Date().toISOString(),
    lastSignalId: last?.signalId || previous?.lastSignalId || null,
    lastDetectedAt: last?.detectedAt || previous?.lastDetectedAt || null,
    files: files.map((path) => basename(path)),
    positions,
  };
  if (options.updateCursor) writeCursor(root, cursor);
  return {
    signals: selected.map((record) => record.signal),
    cursor,
    cursorFound: previous !== null,
  };
}

export function listContentSignals(root = process.cwd()): ContentSignal[] {
  return readAllContentSignals(root)
    .slice()
    .sort((left, right) => right.detectedAt.localeCompare(left.detectedAt));
}
