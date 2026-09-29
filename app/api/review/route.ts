import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isAdmin } from "@/lib/admin-auth";
import { SASB_TOPICS } from "@/lib/esg-data";
import type { ContentItem } from "@/lib/contracts/content";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const PENDING_FILE = resolve(process.cwd(), "data", "review", "pending.json");
const APPROVED_FILE = resolve(process.cwd(), "data", "review", "approved.json");
const REJECTED_FILE = resolve(process.cwd(), "data", "review", "rejected.json");
const DECISIONS_FILE = resolve(process.cwd(), "data", "review", "decisions.json");
const LEARNING_FILE = resolve(process.cwd(), "data", "review", "learning.json");
const IMPORTANCE_LEVELS = ["高", "中", "低"];

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return (Array.isArray(parsed) ? parsed : fallback) as T;
  } catch {
    return fallback;
  }
}

function readObject(path: string): Record<string, unknown> {
  try {
    if (!existsSync(path)) return {};
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function applyEditableFields(item: Record<string, unknown>, body: Record<string, unknown>) {
  const { summary, esgTopic, importanceLevel } = body;
  if (summary !== undefined) {
    if (typeof summary !== "string" || summary.length > 1000) return "摘要格式错误";
    item.summary = summary;
  }
  if (esgTopic !== undefined) {
    if (typeof esgTopic !== "string" || !SASB_TOPICS.includes(esgTopic as (typeof SASB_TOPICS)[number])) return "ESG 议题不在可选范围内";
    item.esgTopic = esgTopic;
  }
  if (importanceLevel !== undefined) {
    if (typeof importanceLevel !== "string" || !IMPORTANCE_LEVELS.includes(importanceLevel)) return "重要性等级不在可选范围内";
    item.importanceLevel = importanceLevel;
  }
  return "";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录后台" }, { status: 401 });
  }
  const drafts = readPublishedContents().filter((item) => item.aiDraft);
  const pending = readJson<Record<string, unknown>[]>(PENDING_FILE, []).filter((item) => item.reviewStatus === "pending");
  const approved = readJson<unknown[]>(APPROVED_FILE, []);
  const rejected = readJson<unknown[]>(REJECTED_FILE, []);
  const decisions = readJson<Record<string, unknown>[]>(DECISIONS_FILE, []);
  const learning = readObject(LEARNING_FILE);
  return NextResponse.json({
    drafts,
    pending,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    decisions: decisions.slice(-10).reverse(),
    learning: {
      updatedAt: typeof learning.updatedAt === "string" ? learning.updatedAt : "",
      recommendations: Array.isArray(learning.recommendations) ? learning.recommendations.length : 0,
    },
  });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录后台" }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const { id, action } = body;
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (action === "approve" || action === "reject") {
    const pending = readJson<Record<string, unknown>[]>(PENDING_FILE, []);
    const pendingIdx = pending.findIndex((item) => item.id === id);
    if (pendingIdx === -1) return NextResponse.json({ error: "待审内容未找到" }, { status: 404 });

    const reviewed = { ...pending[pendingIdx] };
    const fieldError = applyEditableFields(reviewed, body);
    if (fieldError) return NextResponse.json({ error: fieldError }, { status: 400 });
    reviewed.reviewStatus = action === "approve" ? "approved" : "rejected";
    reviewed.reviewDecidedAt = new Date().toISOString();
    reviewed.aiDraft = false;
    pending.splice(pendingIdx, 1);

    // 审阅决定只作用于发布快照，不触碰旧 data/contents.json。
    const contents = readPublishedContents();
    const contentIdx = contents.findIndex((item) => item.id === id);
    if (action === "approve") {
      const approvedItem = reviewed as unknown as ContentItem;
      if (contentIdx === -1) contents.push(approvedItem);
      else contents[contentIdx] = { ...contents[contentIdx], ...approvedItem };
      writePublishedContents(contents);
      const approved = readJson<Record<string, unknown>[]>(APPROVED_FILE, []);
      approved.push(reviewed);
      writeJson(APPROVED_FILE, approved);
    } else {
      if (contentIdx !== -1) {
        contents.splice(contentIdx, 1);
        writePublishedContents(contents);
      }
      const rejected = readJson<Record<string, unknown>[]>(REJECTED_FILE, []);
      rejected.push(reviewed);
      writeJson(REJECTED_FILE, rejected);
    }

    const decisions = readJson<Record<string, unknown>[]>(DECISIONS_FILE, []);
    decisions.push({
      id,
      title: reviewed.title,
      action,
      decidedAt: reviewed.reviewDecidedAt,
      reviewRule: reviewed.reviewRule,
      reviewReason: reviewed.reviewReason,
      sourceUrl: reviewed.sourceUrl,
    });
    writeJson(DECISIONS_FILE, decisions);
    writeJson(PENDING_FILE, pending);
    return NextResponse.json({
      ok: true,
      action,
      item: reviewed,
      learningUpdated: false,
      translationUpdated: false,
    });
  }

  const items = readPublishedContents();
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const item = items[idx] as unknown as Record<string, unknown>;
  const fieldError = applyEditableFields(item, body);
  if (fieldError) return NextResponse.json({ error: fieldError }, { status: 400 });
  item.aiDraft = false;

  writePublishedContents(items);
  return NextResponse.json({ ok: true, item });
}
