import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem } from "../lib/contracts/content";
import { apiAuthError, contentApiPayload } from "../lib/api/v1";

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "src-api-test",
    title: "Test title",
    titleZh: "测试标题",
    summary: "Test summary with concrete facts.",
    summaryZh: "测试摘要包含具体事实、适用范围与实施时间。",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-11-09T00:00:00.000Z",
    importanceLevel: "中",
    sourceName: "Test Source",
    sourceUrl: "https://example.com",
    articleUrl: "https://example.com/article",
    esgTopic: "合规与监管",
    recommended: true,
    recommendReason: "这条内容说明了规则适用范围，可帮助企业判断合规准备。",
    pipeline: {
      score: 82,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-api-test",
      heat: 0,
      tags: ["政策", "合规与监管"],
      pipelineVersion: "test",
    },
    ...overrides,
  };
}

test("private API accepts Bearer and X-API-Key credentials", () => {
  const original = process.env.ESG_API_KEY;
  process.env.ESG_API_KEY = "test-api-key";
  try {
    assert.equal(apiAuthError(new Request("https://example.com"), false), null);
    assert.equal(
      apiAuthError(
        new Request("https://example.com", { headers: { Authorization: "Bearer test-api-key" } }),
        true,
      ),
      null,
    );
    assert.equal(
      apiAuthError(
        new Request("https://example.com", { headers: { "X-API-Key": "test-api-key" } }),
        true,
      ),
      null,
    );
    assert.equal(
      apiAuthError(
        new Request("https://example.com", { headers: { Authorization: "Bearer wrong" } }),
        true,
      )?.status,
      401,
    );
  } finally {
    if (original === undefined) delete process.env.ESG_API_KEY;
    else process.env.ESG_API_KEY = original;
  }
});

test("API payload exposes recommendation reasons only for curated items", () => {
  const curated = contentApiPayload(item());
  const ordinary = contentApiPayload(item({ recommended: false, recommendReason: "不应输出" }));

  assert.equal(curated.displayTitle, "测试标题");
  assert.equal(curated.reason, "这条内容说明了规则适用范围，可帮助企业判断合规准备。");
  assert.equal(ordinary.reason, undefined);
  assert.equal(ordinary.score, 82);
});

test("body fields are returned only on detail requests when requested", () => {
  const content = item({ body: "English body", bodyZh: "中文正文" });

  assert.equal(contentApiPayload(content).bodyZh, undefined);
  assert.equal(contentApiPayload(content, { includeBody: true }).bodyZh, "中文正文");
});
