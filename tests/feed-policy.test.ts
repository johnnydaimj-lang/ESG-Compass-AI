import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem } from "../lib/contracts/content";
import { collapseByStory, isFeedEligible } from "../lib/feed-policy";
import { buildDailyReport } from "../lib/pipeline/daily";

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
    summary: `这条内容提供了区别于标题的具体事实、影响范围与后续安排，可用于公开列表测试。`,
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

test("低分内容即使多源聚类也不进入公开列表", () => {
  const single = item("low-single", 20, "Source A");
  const multiA = item("low-a", 20, "Source A", "story-multi");
  const multiB = item("low-b", 22, "Source B", "story-multi", "2026-10-28T01:00:00.000Z");

  assert.equal(isFeedEligible(single), false);
  assert.equal(isFeedEligible(multiA), false);
  assert.equal(isFeedEligible(multiB), false);
  assert.equal(isFeedEligible(item("threshold", 30, "Source A")), true);
  assert.equal(isFeedEligible({ ...single, pipeline: undefined }), false);
});

test("标题复述或摘要过短的条目不进入公开列表", () => {
  const substantive = item("substantive", 60, "Source A");
  const titleEcho = {
    ...substantive,
    titleZh: "某机构发布新的可持续披露规则",
    summaryZh: "某机构发布新的可持续披露规则。",
  };
  const tooShort = {
    ...substantive,
    titleZh: "某机构发布新的可持续披露规则",
    summaryZh: "新规发布。",
  };
  const firstPerson = {
    ...substantive,
    titleZh: "某机构发布新的可持续披露规则",
    summaryZh: "我们梳理了规则适用范围、实施时间以及企业需要完成的披露准备。",
  };
  const metaCommentary = {
    ...substantive,
    titleZh: "某机构发布新的可持续披露规则",
    summaryZh: "某机构发布新的可持续披露规则。现有中文摘要仅说明该宣布，未提供具体实施安排。",
  };

  assert.equal(isFeedEligible(substantive), true);
  assert.equal(isFeedEligible(titleEcho), false);
  assert.equal(isFeedEligible(tooShort), false);
  assert.equal(isFeedEligible(firstPerson), false);
  assert.equal(isFeedEligible(metaCommentary), false);
});

test("同一故事簇只保留一个代表条目，优先最早发布", () => {
  const earliest = item("earliest", 20, "Source A", "story-1");
  const later = item("later", 22, "Source B", "story-1", "2026-10-28T01:00:00.000Z");
  const collapsed = collapseByStory([later, earliest]);

  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0].id, "earliest");
});

test("日报只保留达到公开门槛的内容", () => {
  const low = item("low", 20, "Source A");
  const high = item("high", 80, "Source B");
  const report = buildDailyReport([low, high], [], new Date("2026-10-28T12:00:00.000Z"));

  assert.deepEqual(report.highlights.map((entry) => entry.id), ["high"]);
  assert.deepEqual(report.sections.flatMap((section) => section.items).map((entry) => entry.id), ["high"]);
});

