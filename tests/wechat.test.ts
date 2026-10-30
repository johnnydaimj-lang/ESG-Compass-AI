import { createCipheriv, createHash, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import {
  contentHashForIssue,
  createInitialDeliveryState,
  deliveryStatePath,
  issueIsDue,
  loadWeeklyIssue,
  readDeliveryState,
  writeDeliveryState,
} from "@/lib/wechat/delivery-store";
import {
  renderWeeklyArticle,
  resolveWeeklySourceUrl,
  validateWechatArticle,
} from "@/lib/wechat/render-weekly";
import { mapWechatPublishStatus, WechatDeliveryService } from "@/lib/wechat/service";
import { decryptWechatPayload, verifyWechatSignature } from "@/lib/wechat/callback";
import type {
  WechatApi,
  WechatConfig,
  WechatDraftArticle,
  WechatPublishResult,
  WechatPublishStatusResult,
} from "@/lib/wechat/types";

const testWechatDataDir = mkdtempSync(join(tmpdir(), "esg-wechat-data-"));
const previousWechatDataDir = process.env.WECHAT_DATA_DIR;
process.env.WECHAT_DATA_DIR = testWechatDataDir;

const testWeeklyPath = join(testWechatDataDir, "weekly", "2026-w43.json");
mkdirSync(dirname(testWeeklyPath), { recursive: true });
copyFileSync(
  join(process.cwd(), "data", "wechat", "weekly", "2026-w43.json"),
  testWeeklyPath,
);

after(() => {
  if (previousWechatDataDir === undefined) {
    delete process.env.WECHAT_DATA_DIR;
  } else {
    process.env.WECHAT_DATA_DIR = previousWechatDataDir;
  }
  rmSync(testWechatDataDir, { recursive: true, force: true });
});

const issue = loadWeeklyIssue("2026-w43");
const issueKey = "2026-w43";

function signWechatPayload(
  token: string,
  timestamp: string,
  nonce: string,
  signedContent?: string,
): string {
  const parts = [token, timestamp, nonce];
  if (signedContent !== undefined) parts.push(signedContent);
  return createHash("sha1").update(parts.sort().join("")).digest("hex");
}

function encryptWechatFixture(message: string, receiveId: string, encodingAesKey: string): string {
  const key = Buffer.from(`${encodingAesKey}=`, "base64");
  const random = randomBytes(16);
  const messageBuffer = Buffer.from(message, "utf8");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(messageBuffer.length, 0);
  const plain = Buffer.concat([random, length, messageBuffer, Buffer.from(receiveId, "utf8")]);
  const paddingLength = 32 - (plain.length % 32);
  const padded = Buffer.concat([plain, Buffer.alloc(paddingLength, paddingLength)]);
  const cipher = createCipheriv("aes-256-cbc", key, key.subarray(0, 16));
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString("base64");
}

function testConfig(overrides: Partial<WechatConfig> = {}): WechatConfig {
  return {
    appId: "wx-test-app",
    appSecret: "test-secret",
    author: "观澜 ESG Compass",
    contentSourceUrl: "https://example.com/weekly/2026-w43",
    coverImagePath: "public/wechat-avatar.png",
    publishMode: "auto_publish",
    stateBackend: "file",
    callbackToken: "callback-token",
    callbackAesKey: "",
    cronSecret: "cron-secret",
    apiBaseUrl: "https://api.weixin.qq.com",
    missing: [],
    ...overrides,
  };
}

interface FakeWechatClient extends WechatApi {
  calls: {
    material: number;
    draft: number;
    submit: number;
    status: number;
  };
  draftArticles: WechatDraftArticle[];
  statusResult: WechatPublishStatusResult;
}

function fakeClient(options: { draftDelayMs?: number } = {}): FakeWechatClient {
  const client: FakeWechatClient = {
    calls: { material: 0, draft: 0, submit: 0, status: 0 },
    draftArticles: [],
    statusResult: { publishStatus: 1 },
    async addPermanentImage() {
      client.calls.material += 1;
      return { mediaId: "thumb-media-1" };
    },
    async addDraft(article) {
      client.calls.draft += 1;
      client.draftArticles.push(article);
      if (options.draftDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.draftDelayMs));
      }
      return { mediaId: `draft-media-${client.calls.draft}` };
    },
    async submitFreepublish() {
      client.calls.submit += 1;
      return {
        publishId: `publish-${client.calls.submit}`,
        publishStatus: 1,
      } satisfies WechatPublishResult;
    },
    async getPublishStatus() {
      client.calls.status += 1;
      return client.statusResult;
    },
  };
  return client;
}

test("周报内容哈希稳定且忽略审核状态字段", () => {
  const first = contentHashForIssue(issue);
  const second = contentHashForIssue({ ...issue, status: "approved", editorial: { ...issue.editorial, reviewStatus: "已审核" } });
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("微信发布测试使用独立的临时存储", () => {
  assert.equal(dirname(deliveryStatePath(issueKey)), join(testWechatDataDir, "delivery"));
});

test("微信文章满足标题、摘要和正文限制", () => {
  const article = renderWeeklyArticle(issue, {
    author: "观澜 ESG Compass",
    contentSourceUrl: "https://example.com/weekly/2026-w43",
  });
  assert.deepEqual(validateWechatArticle(article), []);
  assert.ok(Array.from(article.title).length <= 64);
  assert.ok(Array.from(article.digest).length <= 120);
  assert.ok(article.content.includes("观澜解读"));
});

test("没有公网原文链接时仍可直接创建微信草稿", async () => {
  const article = renderWeeklyArticle(issue, {
    author: "观澜 ESG Compass",
    contentSourceUrl: "",
  });
  assert.equal(article.contentSourceUrl, "");
  assert.deepEqual(validateWechatArticle(article), []);

  const client = fakeClient();
  const service = new WechatDeliveryService({
    config: testConfig({
      contentSourceUrl: "",
      publishMode: "draft_only",
    }),
    client,
    now: () => new Date("2026-10-25T08:00:00.000Z"),
  });

  try {
    service.resetForTesting(issueKey);
    await service.approve(issueKey, {
      reviewer: "测试审核人",
      contentHash: contentHashForIssue(issue),
    });
    await service.syncDraft(issueKey);

    assert.equal(client.calls.draft, 1);
    assert.equal(client.draftArticles[0]?.content_source_url, undefined);
    assert.ok(client.draftArticles[0]?.content.includes("观澜解读"));
  } finally {
    service.resetForTesting(issueKey);
  }
});

test("原文链接模板按每期 issueKey 解析", () => {
  assert.equal(
    resolveWeeklySourceUrl("https://example.com/weekly/{issueKey}", "2026-w43"),
    "https://example.com/weekly/2026-w43",
  );
  assert.equal(
    resolveWeeklySourceUrl("https://example.com/about", "2026-w43"),
    "https://example.com/about",
  );
  assert.equal(resolveWeeklySourceUrl("", "2026-w43"), "");
});

test("计划发布时间按 UTC 表示并可判断到期", () => {
  assert.equal(issue.scheduledAt, "2026-10-26T02:00:00.000Z");
  const state = createInitialDeliveryState(issue, new Date("2026-10-25T00:00:00.000Z"));
  assert.equal(issueIsDue(state, new Date("2026-10-26T01:59:00.000Z")), false);
  assert.equal(issueIsDue(state, new Date("2026-10-26T02:00:00.000Z")), true);
});

test("微信发布状态映射不会把未知状态误判为成功", () => {
  assert.equal(mapWechatPublishStatus(0).state, "published");
  assert.equal(mapWechatPublishStatus(1).state, "publishing");
  assert.equal(mapWechatPublishStatus(4).state, "needs_manual_action");
  assert.equal(mapWechatPublishStatus("unknown").state, "needs_manual_action");
});

test("微信回调签名校验", () => {
  const token = "test-token";
  const timestamp = "1710000000";
  const nonce = "12345";
  const signature = signWechatPayload(token, timestamp, nonce);
  assert.equal(verifyWechatSignature({ token, timestamp, nonce, signature }), true);
  assert.equal(verifyWechatSignature({ token, timestamp, nonce, signature: "bad" }), false);
});

test("AES GET 回调签名必须覆盖 echostr", () => {
  const token = "callback-token";
  const timestamp = "1710000001";
  const nonce = "54321";
  const encodingAesKey = randomBytes(32).toString("base64").replace(/=+$/, "");
  const echostr = encryptWechatFixture("wechat-verification", "wx-test-app", encodingAesKey);
  const signature = signWechatPayload(token, timestamp, nonce, echostr);

  assert.equal(
    verifyWechatSignature({ token, timestamp, nonce, signature, signedContent: echostr }),
    true,
  );
  assert.equal(verifyWechatSignature({ token, timestamp, nonce, signature }), false);
  assert.equal(decryptWechatPayload(echostr, encodingAesKey), "wechat-verification");
});

test("AES POST 回调签名覆盖 XML 中的 Encrypt 负载", () => {
  const token = "callback-token";
  const timestamp = "1710000002";
  const nonce = "24680";
  const encodingAesKey = randomBytes(32).toString("base64").replace(/=+$/, "");
  const encrypted = encryptWechatFixture("publish-event", "wx-test-app", encodingAesKey);
  const xml = `<xml><ToUserName><![CDATA[gh_test]]></ToUserName><Encrypt><![CDATA[${encrypted}]]></Encrypt></xml>`;
  const extracted = xml.match(/<Encrypt><!\[CDATA\[([\s\S]+?)\]\]><\/Encrypt>/)?.[1] || "";
  const msgSignature = signWechatPayload(token, timestamp, nonce, extracted);

  assert.equal(
    verifyWechatSignature({
      token,
      timestamp,
      nonce,
      signature: msgSignature,
      signedContent: extracted,
    }),
    true,
  );
  assert.equal(
    verifyWechatSignature({ token, timestamp, nonce, signature: msgSignature }),
    false,
  );
  assert.equal(decryptWechatPayload(extracted, encodingAesKey), "publish-event");
});

test("正文哈希变化会使既有审批失效", async () => {
  const service = new WechatDeliveryService({
    config: testConfig(),
    client: fakeClient(),
    now: () => new Date("2026-10-25T08:00:00.000Z"),
  });

  try {
    service.resetForTesting(issueKey);
    await service.approve(issueKey, {
      reviewer: "测试审核人",
      contentHash: contentHashForIssue(issue),
    });
    const approved = readDeliveryState(issueKey, issue);
    writeDeliveryState({
      ...approved,
      contentHash: "stale-content-hash",
      approvedContentHash: "stale-content-hash",
      status: "approved",
    });

    const readiness = service.getReadiness(issueKey);
    assert.equal(readiness.status, "review_pending");
    assert.equal(readiness.readyToSync, false);
    assert.ok(readiness.blockers.some((item) => item.includes("人工终审")));
  } finally {
    service.resetForTesting(issueKey);
  }
});

test("并发创建草稿只调用一次微信 draft/add", async () => {
  const client = fakeClient({ draftDelayMs: 80 });
  const service = new WechatDeliveryService({
    config: testConfig(),
    client,
    now: () => new Date("2026-10-25T08:00:00.000Z"),
  });

  try {
    service.resetForTesting(issueKey);
    await service.approve(issueKey, {
      reviewer: "测试审核人",
      contentHash: contentHashForIssue(issue),
    });

    const [first, second] = await Promise.all([
      service.syncDraft(issueKey),
      service.syncDraft(issueKey),
    ]);

    assert.equal(client.calls.draft, 1);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(first.status, "scheduled");
  } finally {
    service.resetForTesting(issueKey);
  }
});

test("已有 publish_id 时不重复调用 freepublish/submit", async () => {
  const client = fakeClient();
  const service = new WechatDeliveryService({
    config: testConfig(),
    client,
    now: () => new Date("2026-10-26T02:01:00.000Z"),
  });

  try {
    service.resetForTesting(issueKey);
    await service.approve(issueKey, {
      reviewer: "测试审核人",
      contentHash: contentHashForIssue(issue),
    });
    await service.syncDraft(issueKey);

    const first = await service.publishDue({ issueKey });
    const second = await service.publishDue({ issueKey });

    assert.equal(client.calls.submit, 1);
    assert.equal(first.results[0]?.publishId, "publish-1");
    assert.equal(second.results[0]?.publishId, "publish-1");
    assert.match(second.results[0]?.message || "", /未重复提交/);
  } finally {
    service.resetForTesting(issueKey);
  }
});
