import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitiveText, safeErrorMessage } from "@/lib/wechat/sanitize";

function fixture(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

test("敏感凭据和平台 ID 在 URL、JSON 与请求头中被脱敏", () => {
  const appId = fixture("app");
  const appSecret = fixture("secret");
  const accessToken = fixture("token");
  const publishId = fixture("publish");
  const text = [
    `https://api.example.test/cgi-bin/check?access_token=${encodeURIComponent(accessToken)}`,
    `{"appId":"${appId}","appSecret":"${appSecret}"}`,
    `Authorization: Bearer ${accessToken}`,
    `{"publish_id":"${publishId}"}`,
  ].join("\n");

  const redacted = redactSensitiveText(text, [appId, appSecret, accessToken, publishId]);

  for (const sensitive of [appId, appSecret, accessToken, publishId]) {
    assert.equal(redacted.includes(sensitive), false);
  }
  assert.match(redacted, /\[REDACTED\]/);
});

test("脱敏不会吞掉普通微信错误码", () => {
  const converted = redactSensitiveText(
    new Error("invalid ip 1.2.3.4, not in whitelist, errcode: 40164"),
  );
  assert.match(converted, /40164/);
  assert.equal(safeErrorMessage(null), "null");
});
