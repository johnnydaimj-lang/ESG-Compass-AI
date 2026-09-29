import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

const ADMIN_PATHS = ["/ops", "/review"];
const ADMIN_API_PATHS = ["/api/ops", "/api/review", "/api/zones", "/api/pipeline/run"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    if (isRateLimited(`api:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "请求过于频繁" }, { status: 429, headers: { "Retry-After": "60" } });
    }

    if (pathname.startsWith("/api/v1/")) {
      const key = process.env.ESG_API_KEY;
      if (!key) return NextResponse.json({ error: "ESG_API_KEY 未配置" }, { status: 503 });
      if (request.headers.get("authorization") !== `Bearer ${key}`) {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
      }
    }

    if (matches(pathname, ADMIN_API_PATHS) && !request.cookies.get("admin_session")?.value) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (matches(pathname, ADMIN_PATHS) && !request.cookies.get("admin_session")?.value) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ops/:path*", "/review", "/api/:path*"],
};
