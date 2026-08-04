import { NextResponse } from "next/server";
import { getAllZones, writeZones } from "@/lib/zones-store";
import { isAdmin } from "@/lib/admin-auth";
import type { Zone } from "@/lib/zones-data";

interface Props { params: Promise<{ id: string }> }

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

export async function PUT(request: Request, { params }: Props) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录工作台" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const zones = getAllZones();
  const index = zones.findIndex((z) => z.id === id);
  if (index < 0) {
    return NextResponse.json({ error: "专区不存在" }, { status: 404 });
  }
  const name = cleanStr(body.name, 80);
  if (!name) {
    return NextResponse.json({ error: "专区名称必填" }, { status: 400 });
  }
  const next: Zone = {
    ...zones[index],
    name,
    description: cleanStr(body.description, 500),
    eventIds: cleanList(body.eventIds),
    keywords: cleanList(body.keywords),
    milestones: cleanMilestones(body.milestones),
  };
  zones[index] = next;
  writeZones(zones);
  return NextResponse.json({ zone: next });
}

export async function DELETE(_request: Request, { params }: Props) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权，请先登录工作台" }, { status: 401 });
  }
  const { id } = await params;
  const zones = getAllZones();
  const next = zones.filter((z) => z.id !== id);
  if (next.length === zones.length) {
    return NextResponse.json({ error: "专区不存在" }, { status: 404 });
  }
  writeZones(next);
  return NextResponse.json({ ok: true });
}
