import { NextResponse } from "next/server";
import { authorizeAdmin, errorResponse } from "@/lib/wechat/http-auth";
import { WechatDeliveryService, WechatServiceError } from "@/lib/wechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ issue: string }> },
) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const { issue } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      reviewer?: string;
      contentHash?: string;
    } | null;
    if (!body?.reviewer || !body?.contentHash) {
      throw new WechatServiceError("审核请求必须包含 reviewer 和 contentHash", {
        code: "REVIEW_FIELDS_REQUIRED",
      });
    }
    const readiness = await new WechatDeliveryService().approve(issue, {
      reviewer: body.reviewer,
      contentHash: body.contentHash,
    });
    return NextResponse.json({ ok: true, readiness });
  } catch (error) {
    return errorResponse(error);
  }
}
