import { NextResponse } from "next/server";
import { createHarnessTask, getHarnessTasks, requestHarnessApproval } from "@/lib/harness";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  return NextResponse.json({ tasks: await getHarnessTasks(50) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 });
  try {
    var body = await request.json();
    var title = String(body.title || "").trim();
    var context = String(body.context || "").trim();
    if (!title) return NextResponse.json({ error: "任务标题不能为空" }, { status: 400 });
    var task = await createHarnessTask({ title: title, context: context });
    if (body.requireApproval?.actionType) {
      task = await requestHarnessApproval(task.id, {
        actionType: body.requireApproval.actionType,
        summary: String(body.requireApproval.summary || "需要人工确认"),
        target: body.requireApproval.target ? String(body.requireApproval.target) : undefined,
      });
    }
    return NextResponse.json({ task: task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "创建 Harness 任务失败：" + (err.message || "未知错误") }, { status: 500 });
  }
}
