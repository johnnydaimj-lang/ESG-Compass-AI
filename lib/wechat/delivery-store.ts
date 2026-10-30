import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  WechatAuditEvent,
  WechatDeliveryState,
  WeeklyDeliveryStatus,
  WeeklyIssue,
} from "@/lib/wechat/types";

const ISSUE_KEY_PATTERN = /^\d{4}-w\d{2}$/;

function wechatDirectory(): string {
  const configured = process.env.WECHAT_DATA_DIR?.trim();
  return configured ? resolve(configured) : resolve(process.cwd(), "data", "wechat");
}

function weeklyDirectory(): string {
  return resolve(wechatDirectory(), "weekly");
}

function deliveryDirectory(): string {
  return resolve(wechatDirectory(), "delivery");
}

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

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export function issueKeyFromIssue(issue: Pick<WeeklyIssue, "year" | "week">): string {
  return `${issue.year}-w${String(issue.week).padStart(2, "0")}`;
}

export function assertIssueKey(issueKey: string): string {
  if (!ISSUE_KEY_PATTERN.test(issueKey)) {
    throw new Error("周报标识格式应为 YYYY-wNN，例如 2026-w43");
  }
  return issueKey;
}

export function weeklyIssuePath(issueKey: string): string {
  return resolve(weeklyDirectory(), `${assertIssueKey(issueKey)}.json`);
}

export function deliveryStatePath(issueKey: string): string {
  return resolve(deliveryDirectory(), `${assertIssueKey(issueKey)}.json`);
}

export function loadWeeklyIssue(issueKey: string): WeeklyIssue {
  const path = weeklyIssuePath(issueKey);
  if (!existsSync(path)) {
    throw new Error(`未找到周报：${issueKey}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as WeeklyIssue;
}

export function listWeeklyIssueKeys(): string[] {
  const directory = weeklyDirectory();
  ensureDirectory(directory);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -5))
    .filter((name) => ISSUE_KEY_PATTERN.test(name))
    .sort();
}

export function contentHashForIssue(issue: WeeklyIssue): string {
  const content = {
    issue: issue.issue,
    year: issue.year,
    week: issue.week,
    rangeStart: issue.rangeStart,
    rangeEnd: issue.rangeEnd,
    scheduledAt: issue.scheduledAt,
    timezone: issue.timezone,
    headline: issue.headline,
    deck: issue.deck,
    stats: issue.stats,
    intro: issue.intro,
    contents: issue.contents,
    stories: issue.stories,
    quickBriefs: issue.quickBriefs,
    outlook: issue.outlook,
    sources: issue.sources,
    editorial: {
      title: issue.editorial.title,
      methodology: issue.editorial.methodology,
    },
  };
  return createContentHash(content);
}

function createContentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function initialStatus(issue: WeeklyIssue): WeeklyDeliveryStatus {
  if (issue.status === "approved") return "approved";
  if (issue.status === "published") return "published";
  return "review_pending";
}

export function createInitialDeliveryState(issue: WeeklyIssue, now = new Date()): WechatDeliveryState {
  const timestamp = now.toISOString();
  return {
    version: 1,
    issueKey: issueKeyFromIssue(issue),
    issue: issue.issue,
    year: issue.year,
    week: issue.week,
    status: initialStatus(issue),
    contentHash: contentHashForIssue(issue),
    scheduledAt: issue.scheduledAt,
    timezone: issue.timezone || "Asia/Shanghai",
    attempts: { sync: 0, publish: 0 },
    history: [
      {
        at: timestamp,
        action: "delivery_state_initialized",
        contentHash: contentHashForIssue(issue),
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function readDeliveryState(issueKey: string, issue?: WeeklyIssue): WechatDeliveryState {
  const normalized = assertIssueKey(issueKey);
  const path = deliveryStatePath(normalized);
  const resolvedIssue = issue || loadWeeklyIssue(normalized);
  if (!existsSync(path)) return createInitialDeliveryState(resolvedIssue);
  const parsed = JSON.parse(readFileSync(path, "utf8")) as WechatDeliveryState;
  return {
    ...createInitialDeliveryState(resolvedIssue, new Date(parsed.createdAt || Date.now())),
    ...parsed,
    attempts: {
      sync: Number(parsed.attempts?.sync) || 0,
      publish: Number(parsed.attempts?.publish) || 0,
    },
    history: Array.isArray(parsed.history) ? parsed.history : [],
  };
}

export function writeDeliveryState(state: WechatDeliveryState): void {
  writeJsonAtomic(deliveryStatePath(state.issueKey), state);
}

export function appendAudit(
  state: WechatDeliveryState,
  event: Omit<WechatAuditEvent, "at"> & { at?: string },
): WechatDeliveryState {
  const at = event.at || new Date().toISOString();
  return {
    ...state,
    updatedAt: at,
    history: [...state.history, { ...event, at }].slice(-100),
  };
}

export function listDeliveryStates(issueKeys = listWeeklyIssueKeys()): WechatDeliveryState[] {
  return issueKeys.map((issueKey) => readDeliveryState(issueKey));
}

export function issueIsDue(state: WechatDeliveryState, now = new Date(), graceMinutes = 180): boolean {
  const scheduled = Date.parse(state.scheduledAt);
  if (!Number.isFinite(scheduled)) return false;
  const current = now.getTime();
  return current >= scheduled && current - scheduled <= graceMinutes * 60_000;
}

export function parseIssueKeyFromFileName(fileName: string): string | null {
  const match = fileName.match(/^(\d{4}-w\d{2})\.json$/);
  return match?.[1] || null;
}
