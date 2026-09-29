import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isAdmin } from "@/lib/admin-auth";

const RULES_FILE = resolve(process.cwd(), "data", "filter-rules.json");

function readRules() {
  try {
    if (!existsSync(RULES_FILE)) return { version: 1, updatedAt: "" };
    return JSON.parse(readFileSync(RULES_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const rules = readRules();
  if (!rules) return NextResponse.json({ error: "规则文件读取失败" }, { status: 500 });
  return NextResponse.json({ rules });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.rules || typeof body.rules !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const prev = readRules() || { version: 1 };
  const next = {
    ...body.rules,
    version: Number(body.rules.version || prev.version || 1),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  try {
    writeFileSync(RULES_FILE, JSON.stringify(next, null, 2) + "\n", "utf-8");
    return NextResponse.json({ ok: true, rules: next });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `保存失败：${message.slice(0, 120)}` }, { status: 500 });
  }
}
