import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildProductTopicResult,
  isWeeklyRoundup,
  productTopicMarkdown,
} from "../lib/content-ops/product-topics";
import {
  appendContentSignals,
  contentOpsPaths,
  readNewContentSignals,
  signalIdFor,
  validateContentSignal,
} from "../lib/content-ops/signal-store";
import type { ContentSignal } from "../lib/content-ops/types";
import type { ContentItem } from "../lib/contracts/content";
import type { StoryCluster } from "../lib/contracts/pipeline";

function signal(overrides: Partial<ContentSignal> = {}): ContentSignal {
  const title = overrides.title || "监管机构发布自然披露征求意见稿";
  const sourceUrl =
    overrides.sourceUrl ||
    "https://www.ifrs.org/projects/work-plan/nature-related-disclosures/";
  const publishedAt = overrides.publishedAt || "2026-10-22";
  const recordId = overrides.provenance?.recordId || "test:01";
  return {
    schemaVersion: "content-signal/v1",
    signalId:
      overrides.signalId ||
      signalIdFor({
        title,
        sourceUrl,
        publishedAt,
        recordId,
      }),
    detectedAt: "2026-10-25T08:00:00.000Z",
    title,
    fact: "监管机构发布了自然相关披露要求的征求意见稿，并开放意见征询。",
    sourceName: "IFRS Foundation",
    sourceUrl,
    publishedAt,
    category: "policy",
    region: "全球",
    sourceGrade: "A",
    isPrimarySource: true,
    evidenceCompleteness: 1,
    whyItMatters: "自然相关风险可能进一步进入财务披露框架。",
    potentialAngles: ["规则阶段与适用边界"],
    watchpoints: ["正式准则的生效时间"],
    stakeholders: ["金融机构"],
    novelty: 0.8,
    materiality: 0.9,
    durability: 0.8,
    priority: "P1",
    status: "ready",
    tags: ["policy", "nature"],
    evidence: [
      {
        id: "S1",
        sourceName: "IFRS Foundation",
        sourceUrl,
        publishedAt,
        sourceGrade: "A",
        locator: "Project update",
        claim: "监管机构发布了自然相关披露要求的征求意见稿。",
        status: "verified",
      },
    ],
    provenance: {
      producer: "employee-1-content-scout",
      pipeline: "manual",
      recordId,
    },
    ...overrides,
  };
}

function withTempRoot(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "esg-content-ops-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function content(overrides: Partial<ContentItem> = {}): ContentItem {
  const title = overrides.title || "监管机构调查企业漂绿声明";
  return {
    id: "content:01",
    title,
    contentType: "行业",
    region: "欧洲",
    publishedAt: "2026-10-22T08:00:00.000Z",
    importanceLevel: "高",
    summary: "监管机构启动调查，企业否认相关指控。",
    titleZh: title,
    summaryZh: "监管机构启动调查，企业否认相关指控。",
    sourceName: "Example News",
    sourceUrl: "https://example.com/source",
    articleUrl: "https://example.com/article",
    esgTopic: "合规与监管",
    pipeline: {
      score: 82,
      scoreThreshold: 60,
      scorePass: true,
      sourceTier: "T1",
      storyId: "story:01",
      heat: 76,
      tags: ["调查", "漂绿"],
      pipelineVersion: "test",
    },
    ...overrides,
  };
}

function story(overrides: Partial<StoryCluster> = {}): StoryCluster {
  return {
    id: "story:01",
    rootId: "content:01",
    title: "监管机构调查企业漂绿声明",
    digest: "多个来源报道同一调查。",
    latest: "企业回应相关指控。",
    memberIds: ["content:01"],
    facts: [],
    participants: ["监管机构", "企业"],
    firstPublishedAt: "2026-10-22T08:00:00.000Z",
    latestPublishedAt: "2026-10-23T08:00:00.000Z",
    heat: 88,
    sourceNames: ["Example News", "另一来源"],
    trend: "up",
    relations: [],
    ...overrides,
  };
}

test("dry-run validates and previews signals without writing shared files", () => {
  withTempRoot((root) => {
    const result = appendContentSignals([signal()], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
      dryRun: true,
    });

    assert.equal(result.added, 1);
    assert.equal(result.skipped, 0);
    assert.equal(result.dryRun, true);
    assert.equal(existsSync(contentOpsPaths(root).signals), false);
    assert.equal(existsSync(contentOpsPaths(root).latest), false);
  });
});

test("signal store appends unique signals once and generates the shared handoff files", () => {
  withTempRoot((root) => {
    const first = appendContentSignals([signal(), signal()], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });
    const second = appendContentSignals([signal()], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });

    assert.equal(first.added, 1);
    assert.equal(first.skipped, 1);
    assert.equal(second.added, 0);
    assert.equal(second.skipped, 1);
    assert.equal(existsSync(first.signalFile), true);
    assert.equal(existsSync(first.briefFile), true);
    assert.equal(existsSync(first.alertFile), true);
    assert.equal(existsSync(first.boardFile), true);
  });
});

test("employee-2 cursor consumes only returned signals and resumes after a limit", () => {
  withTempRoot((root) => {
    const first = signal({
      title: "第一条信号",
      provenance: {
        producer: "employee-1-content-scout",
        pipeline: "manual",
        recordId: "test:01",
      },
    });
    const second = signal({
      title: "第二条信号",
      provenance: {
        producer: "employee-1-content-scout",
        pipeline: "manual",
        recordId: "test:02",
      },
    });
    appendContentSignals([first, second], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });

    const pageOne = readNewContentSignals({
      root,
      consumer: "employee-2",
      limit: 1,
      updateCursor: true,
    });
    const pageTwo = readNewContentSignals({
      root,
      consumer: "employee-2",
      limit: 1,
      updateCursor: true,
    });
    const exhausted = readNewContentSignals({
      root,
      consumer: "employee-2",
      updateCursor: true,
    });

    assert.deepEqual(pageOne.signals.map((item) => item.title), ["第一条信号"]);
    assert.deepEqual(pageTwo.signals.map((item) => item.title), ["第二条信号"]);
    assert.equal(exhausted.signals.length, 0);
  });
});

test("employee-2 receives signals appended after its cursor without rereading old items", () => {
  withTempRoot((root) => {
    appendContentSignals([signal()], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });
    readNewContentSignals({
      root,
      consumer: "employee-2",
      updateCursor: true,
    });

    const later = signal({
      title: "稍后追加的更新",
      provenance: {
        producer: "employee-1-content-scout",
        pipeline: "manual",
        recordId: "test:later",
      },
    });
    appendContentSignals([later], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });

    const incremental = readNewContentSignals({
      root,
      consumer: "employee-2",
      updateCursor: true,
    });
    assert.deepEqual(incremental.signals.map((item) => item.title), ["稍后追加的更新"]);
  });
});

test("a secondary source cannot masquerade as a primary A-grade source", () => {
  const invalid = signal({
    sourceGrade: "B",
    isPrimarySource: true,
  });
  const errors = validateContentSignal(invalid);
  assert.ok(errors.some((error) => error.includes("sourceGrade=A")));
});

test("the handoff source must appear in the evidence trail", () => {
  const invalid = signal({
    evidence: [
      {
        id: "S1",
        sourceName: "Another source",
        sourceUrl: "https://example.com/another-source",
        publishedAt: "2026-10-22",
        sourceGrade: "B",
        locator: "Paragraph 1",
        claim: "A claim",
        status: "revise",
      },
    ],
  });
  const errors = validateContentSignal(invalid);
  assert.ok(errors.some((error) => error.includes("evidence 必须包含交接来源")));
});

test("review drafts are outside the signal cursor and cannot become new handoffs", () => {
  withTempRoot((root) => {
    appendContentSignals([signal()], {
      root,
      detectedAt: "2026-10-25T08:00:00.000Z",
    });
    const paths = contentOpsPaths(root);
    writeFileSync(join(paths.reviews, "draft-final-candidate.md"), "# Pending human review\n", "utf8");

    const firstRead = readNewContentSignals({
      root,
      consumer: "employee-2",
      updateCursor: true,
    });
    const secondRead = readNewContentSignals({
      root,
      consumer: "employee-2",
      updateCursor: true,
    });

    assert.equal(firstRead.signals.length, 1);
    assert.equal(secondRead.signals.length, 0);
  });
});

test("product topic scan excludes weekly roundups by default", () => {
  const weekly = content({
    id: "content:weekly",
    title: "Week in Review: Five ESG Changes",
    articleUrl: "https://example.com/weekly",
  });
  const regular = content({
    id: "content:regular",
    title: "监管机构就漂绿声明启动调查",
  });
  const now = new Date("2026-10-28T00:00:00.000Z");

  assert.equal(isWeeklyRoundup(weekly), true);
  const result = buildProductTopicResult([weekly, regular], [story()], { now });

  assert.deepEqual(result.items.map((item) => item.id), ["content:regular"]);
  assert.equal(result.filters.includeWeekly, false);
});

test("product topic scan can explicitly include weekly roundups", () => {
  const weekly = content({
    id: "content:weekly",
    title: "本周 ESG 动态：五个关键变化",
    articleUrl: "https://example.com/weekly",
  });
  const result = buildProductTopicResult([weekly], [], {
    now: new Date("2026-10-28T00:00:00.000Z"),
    includeWeekly: true,
  });

  assert.deepEqual(result.items.map((item) => item.id), ["content:weekly"]);
  assert.equal(result.filters.includeWeekly, true);
});

test("product topic scan applies date, keyword, content type and score filters", () => {
  const recent = content({
    id: "content:recent",
    title: "银行因漂绿声明被调查",
    summary: "监管机构正在核查银行的可持续基金宣传。",
    pipeline: {
      ...content().pipeline!,
      score: 91,
      tags: ["诉讼", "调查"],
    },
  });
  const old = content({
    id: "content:old",
    title: "银行披露自然风险",
    publishedAt: "2026-01-01T08:00:00.000Z",
  });
  const lowScore = content({
    id: "content:low",
    title: "银行发布可持续发展报告",
    articleUrl: "https://example.com/low",
    pipeline: {
      ...content().pipeline!,
      score: 55,
    },
  });
  const result = buildProductTopicResult([recent, old, lowScore], [], {
    now: new Date("2026-10-28T00:00:00.000Z"),
    days: 30,
    query: "银行 漂绿",
    contentTypes: ["行业"],
    minScore: 80,
  });

  assert.deepEqual(result.items.map((item) => item.id), ["content:recent"]);
  assert.ok(result.items[0].opportunityHints.includes("争议/冲突"));
  assert.ok(result.items[0].opportunityHints.includes("漂绿/误导"));
  assert.ok(result.items[0].opportunityHints.includes("监管/处罚"));
});

test("product topic scan de-duplicates article links and keeps story context", () => {
  const older = content({
    id: "content:older",
    title: "较早的报道",
    articleUrl: "https://example.com/shared-article",
    publishedAt: "2026-10-21T08:00:00.000Z",
  });
  const newer = content({
    id: "content:newer",
    title: "更新后的报道",
    articleUrl: "https://example.com/shared-article",
    publishedAt: "2026-10-24T08:00:00.000Z",
  });
  const result = buildProductTopicResult([older, newer], [story()], {
    now: new Date("2026-10-28T00:00:00.000Z"),
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, "content:newer");
  assert.equal(result.items[0].articleUrl, "https://example.com/shared-article");
  assert.deepEqual(result.items[0].storySourceNames, ["Example News", "另一来源"]);
  assert.equal(result.items[0].storyHeat, 88);
  assert.equal(result.items[0].storyTrend, "up");

  const markdown = productTopicMarkdown(result);
  assert.match(markdown, /不是已经核实的公开事实/);
  assert.match(markdown, /https:\/\/example\.com\/shared-article/);
});

test("minimum score excludes items with no comparable score", () => {
  const unscored = content({
    id: "content:unscored",
    pipeline: undefined,
  });
  const result = buildProductTopicResult([unscored], [], {
    now: new Date("2026-10-28T00:00:00.000Z"),
    minScore: 1,
  });

  assert.equal(result.items.length, 0);
});
