import { NextResponse } from "next/server";
import { authorizeAdmin, errorResponse } from "@/lib/wechat/http-auth";
import { WechatDeliveryService } from "@/lib/wechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, body: { dryRun?: boolean; issueKey?: string }) {
  if (!(await authorizeAdmin(request, true))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    return NextResponse.json(
      await new WechatDeliveryService().publishDue({
        dryRun: body.dryRun,
        issueKey: body.issueKey,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  return handle(request, {});
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    dryRun?: boolean;
    issueKey?: string;
  };
  return handle(request, body);
}
