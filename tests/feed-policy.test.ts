import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem } from "../lib/contracts/content";
import { buildStorySourceCounts, collapseByStory, isFeedEligible } from "../lib/feed-policy";

function item(
  id: string,
  score: number,
  sourceName: string,
  storyId?: string,
  publishedAt = "2026-10-28T00:00:00.000Z"
): ContentItem {
  return {
    id,
    title: id,
    summary: id,
    contentType: "政策",
    region: "全球",
    publishedAt,
    importanceLevel: "中",
    sourceName,
    sourceUrl: "https://example.com",
    esgTopic: "合规与监管",
    recommended: false,
    pipeline: {
      score,
      scoreThreshold: 75,
      scorePass: false,
      sourceTier: "T1",
      storyId: storyId || id,
      heat: 0,
      tags: [],
      pipelineVersion: "test",
    },
  };
}

test("低分内容默认不可见，但多源报道的故事可重新进入", () => {
  const single = item("low-single", 20, "Source A");
  const multiA = item("low-a", 20, "Source A", "story-multi");
  const multiB = item("low-b", 22, "Source B", "story-multi", "2026-10-28T01:00:00.000Z");
  const counts = buildStorySourceCounts([single, multiA, multiB]);

  assert.equal(isFeedEligible(single, counts), false);
  assert.equal(isFeedEligible(multiA, counts), true);
  assert.equal(isFeedEligible(multiB, counts), true);
});

test("同一故事簇只保留一个代表条目，优先最早发布", () => {
  const earliest = item("earliest", 20, "Source A", "story-1");
  const later = item("later", 22, "Source B", "story-1", "2026-10-28T01:00:00.000Z");
  const collapsed = collapseByStory([later, earliest]);

  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0].id, "earliest");
});

