import { NextResponse } from "next/server";
import { authorizeAdmin, errorResponse } from "@/lib/wechat/http-auth";
import { WechatDeliveryService } from "@/lib/wechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ issue: string }> },
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const { issue } = await context.params;
    return NextResponse.json({ ok: true, ...new WechatDeliveryService().getStatus(issue) });
  } catch (error) {
    return errorResponse(error);
  }
}
