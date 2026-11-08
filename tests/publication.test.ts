import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem } from "../lib/contracts/content";
import type { ProcessedMaterial } from "../lib/pipeline/publication";
import { toPublishedItem as publish } from "../lib/pipeline/publication";

const legacyReason = "这是一段不应出现在非精选条目中的历史推荐理由。";

function processed(selected: boolean): ProcessedMaterial {
  const content: ContentItem = {
    id: "item-1",
    title: "Example",
    contentType: "政策",
    region: "全球",
    publishedAt: "2026-11-08T00:00:00.000Z",
    importanceLevel: "中",
    summary: "Example summary",
    sourceName: "Example Source",
    sourceUrl: "https://example.com/item",
    esgTopic: "合规与监管",
    recommendReason: legacyReason,
  };

  return {
    material: {
      id: content.id,
      title: content.title,
      summary: content.summary,
      sourceName: content.sourceName,
      sourceUrl: content.sourceUrl,
      publishedAt: content.publishedAt,
      contentType: content.contentType,
      region: content.region,
      content,
    },
    sourceTier: "T1",
    prefilter: { label: "PASS", reason: "relevant" },
    decision: {
      runs: [
        { score: selected ? 80 : 50, axes: axes() },
        { score: selected ? 82 : 52, axes: axes() },
      ],
      displayScore: selected ? 80 : 50,
      threshold: 75,
      understandFloor: 45,
      selected,
      reason: selected ? "selected" : "below threshold",
    },
    understanding: {
      itemType: "policy_regulation",
      authorRole: "principal",
      tags: ["合规"],
      editorialJudgment: selected ? "精选条目推荐理由。" : "非精选旧分析。",
      titleZh: "示例标题",
      summaryZh: "示例摘要",
    },
    fact: {
      title: "示例标题",
      subject: "示例主体",
      action: "发布",
      object: "示例文件",
      occurredAt: "2026-11-08",
    },
    legacySelected: false,
  };
}

function axes() {
  return {
    significance: 5,
    novelty: 5,
    credibility: 5,
    resonance: 5,
    actionability: 5,
  };
}

const story = {
  id: "story-1",
  rootId: "item-1",
  title: "示例标题",
  digest: "示例摘要",
  latest: "示例摘要",
  memberIds: ["item-1"],
  facts: [],
  participants: ["example"],
  firstPublishedAt: "2026-11-08T00:00:00.000Z",
  latestPublishedAt: "2026-11-08T00:00:00.000Z",
  heat: 0,
  relations: [
    { memberId: "item-1", relation: "SAME_OCCURRENCE" as const, confidence: 1 },
  ],
};

test("non-curated published items never retain a recommendation reason", () => {
  const item = publish(processed(false), story);

  assert.equal(item.recommended, false);
  assert.equal(item.recommendReason, "");
});

test("curated published items retain their editorial recommendation reason", () => {
  const item = publish(processed(true), story);

  assert.equal(item.recommended, true);
  assert.equal(item.recommendReason, "精选条目推荐理由。");
});
