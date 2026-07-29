import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    var body = await request.json();
    var password = String(body.password || "");
    var adminPassword = process.env.ADMIN_PASSWORD || "esgcompass2024";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    var response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
