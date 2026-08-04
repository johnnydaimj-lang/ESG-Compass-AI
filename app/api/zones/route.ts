import { NextResponse } from "next/server";
import { getAllZones, writeZones } from "@/lib/zones-store";
import { isAdmin } from "@/lib/admin-auth";
import type { Zone } from "@/lib/zones-data";

function cleanStr(value: unknown, max = 500): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function cleanMilestones(value: unknown): Zone["milestones"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m: any) => ({
      date: String(m?.date || "").trim().slice(0, 20),
      title: String(m?.title || "").trim().slice(0, 120),
      summary: String(m?.summary || "").trim().slice(0, 500),
    }))
    .filter((m) => m.title || m.summary || m.date);
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `zone-${Date.now().toString(36)}`;
}

export async function GET() {
  return NextResponse.json({ zones: getAllZones() });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录工作台" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const name = cleanStr(body.name, 80);
  if (!name) {
    return NextResponse.json({ error: "专区名称必填" }, { status: 400 });
  }
  const zones = getAllZones();
  let id = slugify(name);
  let suffix = 2;
  while (zones.some((z) => z.id === id)) {
    id = `${slugify(name)}-${suffix}`;
    suffix += 1;
  }
  const zone: Zone = {
    id,
    name,
    description: cleanStr(body.description, 500),
    eventIds: cleanList(body.eventIds),
    keywords: cleanList(body.keywords),
    milestones: cleanMilestones(body.milestones),
  };
  writeZones([...zones, zone]);
  return NextResponse.json({ zone }, { status: 201 });
}
