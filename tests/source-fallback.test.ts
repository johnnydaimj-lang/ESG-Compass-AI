import assert from "node:assert/strict";
import test from "node:test";

import type { SourceConfig } from "../lib/pipeline/collect";
import { buildFallbackSources } from "../lib/pipeline/source-fallback";

const source: SourceConfig = {
  id: "example",
  name: "示例主源",
  url: "https://example.com",
  type: "wechat-search",
  contentType: "行业",
  region: "全球",
  requiresEnv: "SOGOU_COOKIE",
  fallbackOnEmpty: true,
  fallbacks: [
    {
      name: "示例 RSS",
      type: "rss",
      url: "https://example.com/feed.xml",
      limit: 10,
    },
  ],
};

test("fallback source inherits editorial metadata but not main-channel credentials", () => {
  const [fallback] = buildFallbackSources(source);
  assert.equal(fallback.id, "example--fallback-1");
  assert.equal(fallback.name, "示例 RSS");
  assert.equal(fallback.type, "rss");
  assert.equal(fallback.url, "https://example.com/feed.xml");
  assert.equal(fallback.contentType, "行业");
  assert.equal(fallback.region, "全球");
  assert.equal(fallback.requiresEnv, undefined);
  assert.equal(fallback.fallbackOnEmpty, false);
  assert.deepEqual(fallback.fallbacks, []);
});

test("fallback-specific credentials remain enforceable", () => {
  const [fallback] = buildFallbackSources({
    ...source,
    fallbacks: [{
      name: "受控备用源",
      type: "rss",
      url: "https://example.com/private.xml",
      requiresEnv: "FALLBACK_TOKEN",
    }],
  });
  assert.equal(fallback.requiresEnv, "FALLBACK_TOKEN");
});
