import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24;

// 会话令牌用服务端密钥做 HMAC 签名，避免客户端伪造；生产环境请显式配置 ADMIN_SESSION_SECRET
const sessionSecret = process.env.ADMIN_SESSION_SECRET || randomBytes(32).toString("hex");

if (!process.env.ADMIN_SESSION_SECRET && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("[admin-auth] 未配置 ADMIN_SESSION_SECRET，生产环境登录会话将在服务重启后失效");
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

export function setAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}
