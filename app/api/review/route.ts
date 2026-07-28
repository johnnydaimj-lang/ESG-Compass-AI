import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DATA_FILE = resolve(process.cwd(), "data", "contents.json");

function readContents() {
  try { if (!existsSync(DATA_FILE)) return []; return JSON.parse(readFileSync(DATA_FILE, "utf-8")); }
  catch { return []; }
}

function writeContents(data: unknown) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const items = readContents();
  const drafts = items.filter((i: any) => i.aiDraft);
  return NextResponse.json(drafts);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, summary, esgTopic, importanceLevel } = body;
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const items = readContents();
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "未找到" }, { status: 404 });

  if (summary !== undefined) items[idx].summary = summary;
  if (esgTopic !== undefined) items[idx].esgTopic = esgTopic;
  if (importanceLevel !== undefined) items[idx].importanceLevel = importanceLevel;
  items[idx].aiDraft = false;

  writeContents(items);
  return NextResponse.json({ ok: true, item: items[idx] });
}
