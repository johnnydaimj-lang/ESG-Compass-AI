import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24;

// 会话令牌用服务端密钥做 HMAC 签名，避免客户端伪造。
// 密钥优先取环境变量；未配置时持久化到本地文件，保证各路由实例与重启后仍能验证同一会话。
const SECRET_FILE = resolve(process.cwd(), "data", ".admin-session-secret");

function loadOrCreateSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET;
  if (fromEnv) return fromEnv;
  try {
    if (existsSync(SECRET_FILE)) {
      const saved = readFileSync(SECRET_FILE, "utf8").trim();
      if (saved) return saved;
    }
    const generated = randomBytes(32).toString("hex");
    writeFileSync(SECRET_FILE, generated, { encoding: "utf8", mode: 0o600 });
    return generated;
  } catch {
    // 只读环境（如未配置 ADMIN_SESSION_SECRET 的 serverless）：退化为进程内随机值，跨路由实例会失效
    return randomBytes(32).toString("hex");
  }
}

const sessionSecret = loadOrCreateSecret();

if (!process.env.ADMIN_SESSION_SECRET && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("[admin-auth] 未配置 ADMIN_SESSION_SECRET，生产环境请设置该环境变量，否则 serverless 上会话可能跨路由失效");
}

export function createSessionToken(): string {
  const value = randomBytes(24).toString("base64url");
  const sig = createHmac("sha256", sessionSecret).update(value).digest("base64url");
  return `${value}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const value = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret).update(value).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  try {
    const store = await cookies();
    return verifySessionToken(store.get(SESSION_COOKIE)?.value);
  } catch {
    return false;
  }
}

export function setAdminSessionCookie(response: NextResponse, secure = process.env.NODE_ENV === "production"): NextResponse {
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
