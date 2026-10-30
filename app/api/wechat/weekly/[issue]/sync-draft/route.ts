import { NextResponse } from "next/server";
import { authorizeAdmin, errorResponse } from "@/lib/wechat/http-auth";
import { WechatDeliveryService } from "@/lib/wechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ issue: string }> },
) {
  if (!(await authorizeAdmin(request, true))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const { issue } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };
    return NextResponse.json(
      await new WechatDeliveryService().syncDraft(issue, { dryRun: body.dryRun }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
