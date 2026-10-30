import { NextResponse } from "next/server";
import { authorizeAdmin, errorResponse } from "@/lib/wechat/http-auth";
import { WechatDeliveryService } from "@/lib/wechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await authorizeAdmin(request))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    return NextResponse.json({
      ok: true,
      ...new WechatDeliveryService().listStatuses(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
