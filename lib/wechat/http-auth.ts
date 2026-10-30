import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getWechatConfig } from "@/lib/wechat/config";
import { safeErrorMessage } from "@/lib/wechat/sanitize";
import { WechatServiceError } from "@/lib/wechat/service";

function secretMatches(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function isCronRequest(request: Request): boolean {
  const expected = getWechatConfig().cronSecret;
  if (!expected) return false;
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const provided = bearer || request.headers.get("x-cron-secret") || "";
  return secretMatches(provided, expected);
}

export async function authorizeAdmin(request: Request, allowCron = false): Promise<boolean> {
  if (allowCron && isCronRequest(request)) return true;
  return isAdmin();
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof WechatServiceError) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error), code: error.code },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { ok: false, error: safeErrorMessage(error) },
    { status: 500 },
  );
}
