import { createDecipheriv, createHash, timingSafeEqual } from "node:crypto";

export function verifyWechatSignature(input: {
  token: string;
  signature: string;
  timestamp: string;
  nonce: string;
  /**
   * WeChat's msg_signature includes the encrypted payload. For the GET
   * verification handshake that payload is the echostr; for POST it is the
   * Encrypt element extracted from the XML body.
   */
  signedContent?: string;
  encrypt?: string;
}): boolean {
  if (!input.token || !input.signature || !input.timestamp || !input.nonce) return false;
  const payload = input.signedContent !== undefined ? input.signedContent : input.encrypt;
  const parts = [input.token, input.timestamp, input.nonce];
  // Keep the older `encrypt` name for callers that pass a non-empty payload.
  // An empty `signedContent` must still be included when explicitly supplied.
  if (payload !== undefined) parts.push(payload);
  const expected = createHash("sha1")
    .update(parts.sort().join(""))
    .digest("hex");
  const providedBuffer = Buffer.from(input.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function decryptWechatPayload(encrypted: string, encodingAesKey: string): string {
  const key = Buffer.from(`${encodingAesKey}=`, "base64");
  if (key.length !== 32) throw new Error("WECHAT_CALLBACK_AES_KEY 必须是 43 字符的 EncodingAESKey");
  const iv = key.subarray(0, 16);
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  decipher.setAutoPadding(true);
  const plain = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]);
  if (plain.length < 20) throw new Error("微信回调密文长度无效");
  const messageLength = plain.readUInt32BE(16);
  if (messageLength > plain.length - 20) throw new Error("微信回调消息长度无效");
  return plain.subarray(20, 20 + messageLength).toString("utf8");
}
