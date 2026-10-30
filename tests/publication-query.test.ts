import assert from "node:assert/strict";
import test from "node:test";
import type { ContentItem } from "../lib/contracts/content";
import {
  contentTypeFromSlug,
  dedupeContents,
  matchesContentQuery,
  queryContents,
} from "../lib/publication-query";

function content(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: "default",
    title: "Default title",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-10-20T08:00:00+08:00",
    importanceLevel: "中",
    summary: "Default summary",
    sourceName: "Default source",
    sourceUrl: "https://example.com/default",
    esgTopic: "气候风险",
    ...overrides,
  };
}

test("content slugs map to the public content types", () => {
  assert.equal(contentTypeFromSlug("policy"), "政策");
  assert.equal(contentTypeFromSlug("academic"), "学术");
  assert.equal(contentTypeFromSlug("unknown"), undefined);
});

test("dedupe keeps the first published item and sorting is newest first", () => {
  const items = [
    content({ id: "a", title: "First", publishedAt: "2026-10-20T08:00:00+08:00" }),
    content({ id: "b", title: "Newest", publishedAt: "2026-10-22T08:00:00+08:00" }),
    content({ id: "a", title: "Duplicate", publishedAt: "2026-10-23T08:00:00+08:00" }),
  ];

  assert.deepEqual(dedupeContents(items).map((item) => item.title), ["First", "Newest"]);
  assert.deepEqual(queryContents(items).map((item) => item.title), ["Newest", "First"]);
});

test("search covers Chinese and English titles, summaries, sources and tags", () => {
  const carbon = content({
    id: "carbon",
    title: "Carbon border adjustment enters enforcement",
    titleZh: "碳边境调节机制进入执行阶段",
    summary: "进口商需要申报产品隐含排放。",
    sourceName: "Reuters",
    pipeline: {
      score: 88,
      scoreThreshold: 75,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story-carbon",
      heat: 12,
      tags: ["CBAM", "供应链"],
      pipelineVersion: "test",
    },
  });
  const other = content({ id: "other", title: "ESG fund flows", summary: "Weekly market note." });

  assert.equal(matchesContentQuery(carbon, { q: "碳边境" }), true);
  assert.equal(matchesContentQuery(carbon, { q: "reuters" }), true);
  assert.equal(matchesContentQuery(carbon, { q: "cbam 供应链" }), true);
  assert.equal(matchesContentQuery(other, { q: "碳边境" }), false);
});

test("query combines type, month, curated and draft filters", () => {
  const items = [
    content({
      id: "selected",
      contentType: "行业",
      publishedAt: "2026-09-05T08:00:00+08:00",
      recommended: true,
    }),
    content({
      id: "old",
      contentType: "行业",
      publishedAt: "2026-08-05T08:00:00+08:00",
      recommended: true,
    }),
    content({
      id: "draft",
      contentType: "行业",
      publishedAt: "2026-09-08T08:00:00+08:00",
      recommended: true,
      aiDraft: true,
    }),
    content({
      id: "policy",
      contentType: "政策",
      publishedAt: "2026-09-10T08:00:00+08:00",
      recommended: true,
    }),
  ];

  const result = queryContents(items, {
    contentType: "行业",
    month: "2026-09",
    recommended: true,
    excludeDrafts: true,
  });

  assert.deepEqual(result.map((item) => item.id), ["selected"]);
});
