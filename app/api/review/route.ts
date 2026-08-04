import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isAdmin } from "@/lib/admin-auth";
import { SASB_TOPICS } from "@/lib/esg-data";

const DATA_FILE = resolve(process.cwd(), "data", "contents.json");
const IMPORTANCE_LEVELS = ["高", "中", "低"];

function readContents() {
  try { if (!existsSync(DATA_FILE)) return []; return JSON.parse(readFileSync(DATA_FILE, "utf-8")); }
  catch { return []; }
}

function writeContents(data: unknown) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录工作台" }, { status: 401 });
  }
  const items = readContents();
  const drafts = items.filter((i: any) => i.aiDraft);
  return NextResponse.json(drafts);
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录工作台" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const { id, summary, esgTopic, importanceLevel } = body;
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const items = readContents();
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "未找到" }, { status: 404 });

  if (summary !== undefined) {
    if (typeof summary !== "string" || summary.length > 1000) {
      return NextResponse.json({ error: "摘要格式错误" }, { status: 400 });
    }
    items[idx].summary = summary;
  }
  if (esgTopic !== undefined) {
    if (typeof esgTopic !== "string" || !SASB_TOPICS.includes(esgTopic as any)) {
      return NextResponse.json({ error: "ESG 议题不在可选范围内" }, { status: 400 });
    }
    items[idx].esgTopic = esgTopic;
  }
  if (importanceLevel !== undefined) {
    if (typeof importanceLevel !== "string" || !IMPORTANCE_LEVELS.includes(importanceLevel)) {
      return NextResponse.json({ error: "重要性等级不在可选范围内" }, { status: 400 });
    }
    items[idx].importanceLevel = importanceLevel as any;
  }
  items[idx].aiDraft = false;

  writeContents(items);
  return NextResponse.json({ ok: true, item: items[idx] });
}
