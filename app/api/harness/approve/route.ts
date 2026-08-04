import { NextResponse } from "next/server";
import { decideHarnessApproval } from "@/lib/harness";
import { isAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  try {
    var body = await request.json();
    if (!body.taskId || !body.approvalId || !["approve", "reject"].includes(body.decision)) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }
    var task = await decideHarnessApproval(String(body.taskId), String(body.approvalId), body.decision as "approve" | "reject");
    return NextResponse.json({ task: task });
  } catch (err: any) {
    return NextResponse.json({ error: "处理人工确认失败：" + (err.message || "未知错误") }, { status: 500 });
  }
}
