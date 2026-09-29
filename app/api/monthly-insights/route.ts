import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, renameSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { isAdmin } from "@/lib/admin-auth";

const DRAFT_DIR = resolve(process.cwd(), "data", "review", "monthly-insights", "drafts");
const APPROVED_DIR = resolve(process.cwd(), "data", "review", "monthly-insights", "approved");
const PUBLISH_DIR = resolve(process.cwd(), "docs", "monthly-insights");

function safeName(name: string): string {
  const n = basename(String(name || ""));
  return /^[a-zA-Z0-9_\-\u3400-\u9fff]+\.md$/.test(n) ? n : "";
}

function readDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
}

function readEntry(dir: string, name: string) {
  const path = join(dir, name);
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const drafts = readDir(DRAFT_DIR);
  const approved = readDir(APPROVED_DIR);
  const published = readDir(PUBLISH_DIR);
  const data = {
    drafts: drafts.map((name) => ({ name, content: readEntry(DRAFT_DIR, name) })),
    approved: approved.map((name) => ({ name, content: readEntry(APPROVED_DIR, name) })),
    published: published.map((name) => ({ name, content: readEntry(PUBLISH_DIR, name) })),
  };
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const name = safeName(body?.name);
  if (!name) return NextResponse.json({ error: "文件名格式错误" }, { status: 400 });

  const action = body?.action === "publish" ? "publish" : body?.action === "save" ? "save" : "";
  if (!action) return NextResponse.json({ error: "缺少 action" }, { status: 400 });

  const draftPath = join(DRAFT_DIR, name);
  const previous = existsSync(draftPath) ? readFileSync(draftPath, "utf8") : "";
  const content = typeof body?.content === "string" && body.content.trim()
    ? body.content
    : previous;
  if (!content.trim()) return NextResponse.json({ error: "草稿内容为空" }, { status: 400 });

  mkdirSync(DRAFT_DIR, { recursive: true });
  mkdirSync(APPROVED_DIR, { recursive: true });
  mkdirSync(PUBLISH_DIR, { recursive: true });

  if (action === "save") {
    writeFileSync(draftPath, content, "utf8");
    return NextResponse.json({ ok: true, name, status: "draft" });
  }

  writeFileSync(join(PUBLISH_DIR, name), content, "utf8");
  if (existsSync(draftPath)) {
    renameSync(draftPath, join(APPROVED_DIR, name));
  } else {
    writeFileSync(join(APPROVED_DIR, name), content, "utf8");
  }
  return NextResponse.json({ ok: true, name, status: "published" });
}
