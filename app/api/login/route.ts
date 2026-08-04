import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/admin-auth";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, recent);
  if (recent.length >= MAX_ATTEMPTS) return true;
  if (attempts.size > 5000) {
    for (const [key, list] of attempts) {
      if (list.every((t) => now - t >= WINDOW_MS)) attempts.delete(key);
    }
  }
  return false;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
}

function passwordsEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "尝试次数过多，请 15 分钟后再试" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const password = String(body.password || "");
    // 生产环境不允许默认密码；本地开发未配置 ADMIN_PASSWORD 时保留旧默认值
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "esgcompass2024");

    if (!adminPassword || !password || !passwordsEqual(password, adminPassword)) {
      recordFailure(ip);
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    attempts.delete(ip);
    return setAdminSessionCookie(NextResponse.json({ ok: true }));
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
