import { NextResponse } from "next/server";
import { decryptWechatPayload, verifyWechatSignature } from "@/lib/wechat/callback";
import { getWechatConfig } from "@/lib/wechat/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function query(request: Request) {
  const url = new URL(request.url);
  return {
    signature: url.searchParams.get("signature") || "",
    timestamp: url.searchParams.get("timestamp") || "",
    nonce: url.searchParams.get("nonce") || "",
    echostr: url.searchParams.get("echostr") || "",
    encrypt: url.searchParams.get("encrypt") || "",
    msgSignature: url.searchParams.get("msg_signature") || "",
    encryptType: url.searchParams.get("encrypt_type") || "",
  };
}

function extractEncryptedPayload(body: string): string {
  return body.match(/<Encrypt><!\[CDATA\[([\s\S]+?)\]\]><\/Encrypt>/)?.[1]
    || body.match(/<Encrypt>([\s\S]+?)<\/Encrypt>/)?.[1]
    || "";
}

export async function GET(request: Request) {
  const config = getWechatConfig();
  const input = query(request);
  const encryptedMode = Boolean(input.msgSignature) || Boolean(input.encrypt) || input.encryptType === "aes";
  const signature = encryptedMode ? input.msgSignature : input.signature;
  if (!verifyWechatSignature({
    token: config.callbackToken,
    signature,
    timestamp: input.timestamp,
    nonce: input.nonce,
    // For the encrypted GET handshake, msg_signature is calculated over
    // token, timestamp, nonce and echostr.
    signedContent: encryptedMode ? input.echostr : undefined,
  })) {
    return new NextResponse("invalid signature", { status: 403 });
  }
  try {
    const echostr = encryptedMode
      ? (config.callbackAesKey
          ? decryptWechatPayload(input.echostr, config.callbackAesKey)
          : "")
      : input.echostr;
    if (encryptedMode && !echostr) {
      return new NextResponse("callback AES key is not configured", { status: 503 });
    }
    return new NextResponse(echostr || "ok");
  } catch {
    return new NextResponse("invalid encrypted payload", { status: 403 });
  }
}

export async function POST(request: Request) {
  const config = getWechatConfig();
  const input = query(request);
  // 发表状态以 freepublish/get 轮询为准。回调只确认事件已收到，避免重复提交。
  const body = await request.text().catch(() => "");
  const encrypted = extractEncryptedPayload(body);
  const encryptedMode = input.encryptType === "aes" || Boolean(input.msgSignature) || Boolean(encrypted);

  if (encryptedMode) {
    if (!encrypted || !input.msgSignature || !config.callbackAesKey) {
      return new NextResponse("invalid encrypted callback", { status: 403 });
    }
    // The encrypted POST signature is over token, timestamp, nonce and the
    // Encrypt value, not the outer XML body or query `encrypt`.
    if (!verifyWechatSignature({
      token: config.callbackToken,
      signature: input.msgSignature,
      timestamp: input.timestamp,
      nonce: input.nonce,
      signedContent: encrypted,
    })) {
      return new NextResponse("invalid signature", { status: 403 });
    }
    try {
      decryptWechatPayload(encrypted, config.callbackAesKey);
    } catch {
      return new NextResponse("invalid encrypted payload", { status: 403 });
    }
  } else if (!verifyWechatSignature({
    token: config.callbackToken,
    signature: input.signature,
    timestamp: input.timestamp,
    nonce: input.nonce,
  })) {
    return new NextResponse("invalid signature", { status: 403 });
  }
  return new NextResponse("success");
}
