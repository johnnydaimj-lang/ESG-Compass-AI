import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItem, StructuredFact } from "../lib/contracts/content";
import type { RawMaterial } from "../lib/contracts/pipeline";
import { clusterMaterials, type ClusterInput } from "../lib/pipeline/cluster";

function fact(title: string): StructuredFact {
  return { title, subject: "sub", action: "act", object: "obj", occurredAt: null };
}

function material(id: string, title: string, publishedAt: string, esgTopic = "气候"): RawMaterial {
  const content: ContentItem = {
    id,
    title,
    contentType: "政策",
    region: "全球",
    publishedAt,
    importanceLevel: "中",
    summary: title,
    sourceName: "测试来源",
    sourceUrl: `https://example.com/${id}`,
    esgTopic,
  };
  return {
    id,
    title,
    summary: title,
    body: "",
    sourceName: "测试来源",
    sourceUrl: `https://example.com/${id}`,
    publishedAt,
    contentType: "政策",
    region: "全球",
    esgTopic,
    content,
  };
}

function input(
  id: string,
  sourceId: string,
  title: string,
  publishedAt: string
): ClusterInput {
  const m = material(id, title, publishedAt);
  return {
    material: m,
    sourceId,
    sourceTier: "T1",
    editorialSource: true,
    fact: fact(title),
  };
}

test("identical text merges into a single cluster", () => {
  const clusters = clusterMaterials([
    input("m-1", "src-a", "全球碳市场新规正式生效", "2026-09-20T00:00:00Z"),
    input("m-2", "src-b", "全球碳市场新规正式生效", "2026-09-20T01:00:00Z"),
  ]);
  assert.equal(clusters.length, 1);
  assert.deepEqual(clusters[0].memberIds, ["m-1", "m-2"]);
  assert.deepEqual(clusters[0].participants.sort(), ["src-a", "src-b"]);
  assert.equal(clusters[0].relations[1].relation, "SAME_OCCURRENCE");
});

test("unrelated text stays in separate clusters", () => {
  const clusters = clusterMaterials([
    input("m-1", "src-a", "全球碳市场新规正式生效", "2026-09-20T00:00:00Z"),
    input("m-2", "src-b", "某公司发布年度可持续报告", "2026-09-21T00:00:00Z"),
  ]);
  assert.equal(clusters.length, 2);
});

test("material ids and source ids are tracked separately", () => {
  const clusters = clusterMaterials([
    input("m-1", "src-a", "同一家公司的同一事件", "2026-09-20T00:00:00Z"),
    input("m-2", "src-a", "同一家公司的同一事件", "2026-09-20T02:00:00Z"),
  ]);
  assert.equal(clusters.length, 1);
  assert.deepEqual(clusters[0].memberIds, ["m-1", "m-2"]);
  assert.deepEqual(clusters[0].participants, ["src-a"]);
});

test("materials beyond the recall window are not merged", () => {
  const clusters = clusterMaterials([
    input("m-1", "src-a", "全球碳市场新规正式生效", "2026-01-01T00:00:00Z"),
    input("m-2", "src-b", "全球碳市场新规正式生效", "2026-03-01T00:00:00Z"),
  ]);
  assert.equal(clusters.length, 2);
});

test("the similarity floor is configurable", () => {
  const clusters = clusterMaterials(
    [
      input("m-1", "src-a", "全球碳市场新规正式生效", "2026-09-20T00:00:00Z"),
      input("m-2", "src-b", "全球碳市场新规正式生效", "2026-09-20T01:00:00Z"),
    ],
    { similarityFloor: 2 }
  );
  assert.equal(clusters.length, 2);
});
