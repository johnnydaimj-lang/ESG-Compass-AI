import { NextResponse } from "next/server";
import { getHarnessLogs } from "@/lib/harness";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  return NextResponse.json({ logs: await getHarnessLogs(80) });
}
