import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentItem } from "../lib/contracts/content";
import { resolvePolicyContext, sourceKey, type PolicyContext } from "../lib/policy-context";
import { PolicyInsights, PolicySource } from "../components/PolicyContext";

const contents = JSON.parse(readFileSync("data/publication/contents.json", "utf8")) as ContentItem[];
const seed = JSON.parse(readFileSync("data/publication/event-progress.json", "utf8"));
const uk = seed.matters[0].policy as PolicyContext;
const asOf = "2026-11-19";
const original = contents.find((item) => item.id === "src-fu90e2")!;

test("verified source and interpretation keep distinct dates, issuer, authors and attribution", () => {
  const resolved = resolvePolicyContext(uk, contents, asOf)!;
  assert.equal(resolved.document.publishedOn, "2026-11-04");
  assert.equal(resolved.insights[0].content.publishedAt.slice(0, 10), "2026-11-09");
  assert.equal(resolved.insights[0].authors.length, 4);
  const source = renderToStaticMarkup(createElement(PolicySource, { policy: resolved, item: original }));
  const insights = renderToStaticMarkup(createElement(PolicyInsights, { policy: resolved, currentId: original.id }));
  assert.ok(source.includes("发布机构原文") && source.includes("立法声明") && source.includes("本条快讯来源"));
  assert.ok(insights.includes("阅读解读") && insights.includes("本条快讯来源的解读"));
  assert.ok(!insights.includes(`/events/${original.id}`));
  const eu = resolvePolicyContext(seed.matters[1].policy, contents, asOf)!;
  assert.equal(eu.insights.length, 0);
  assert.equal(renderToStaticMarkup(createElement(PolicyInsights, { policy: eu, currentId: "src-iauei6" })), "");
});

test("candidates, unsafe URLs, mismatched hosts, unknown or future verification cannot become official documents", () => {
  for (const raw of [null, {}, { ...uk, document: { ...uk.document, verifiedOn: undefined } },
    { ...uk, document: { ...uk.document, kind: "媒体报道" } },
    { ...uk, document: { ...uk.document, verifiedOn: "2026-11-20" } },
    { ...uk, document: { ...uk.document, publishedOn: "2026-02-30" } }]) {
    assert.equal(resolvePolicyContext(raw, contents, asOf), undefined);
  }
  for (const url of ["javascript:alert(1)", "https://questions-statements.parliament.uk.evil.example/document", "https://example.com/document", "https://questions-statements.parliament.uk/", "http://questions-statements.parliament.uk/document"]) {
    assert.equal(resolvePolicyContext({ ...uk, document: { ...uk.document, url } }, contents, asOf), undefined);
  }
});

test("only explicit, reviewed, eligible and distinct interpretations are shown", () => {
  const unlinked = { ...original, id: "same-topic" };
  const policy = { ...uk, insights: [...uk.insights, ...uk.insights,
    { ...uk.insights[0], contentId: "missing" },
    { ...uk.insights[0], contentId: "same-topic", evidenceLocator: "" }] };
  assert.equal(resolvePolicyContext(policy, [...contents, unlinked], asOf)!.insights.length, 1);
  const low = { ...original, pipeline: { ...original.pipeline!, score: 1 } };
  assert.equal(resolvePolicyContext(uk, [low], asOf)!.insights.length, 0);
  assert.equal(resolvePolicyContext({ ...uk, insights: [{ ...uk.insights[0], reviewedOn: "2026-11-08" }] }, contents, asOf)!.insights.length, 0);
});

test("three interpretations are visible by default and the rest expand without repeating summaries", () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ ...original, id: `insight-${i}`, articleUrl: `https://example.com/insight-${i}` }));
  const policy = { ...uk, insights: items.map((item) => ({ ...uk.insights[0], contentId: item.id })) };
  const resolved = resolvePolicyContext(policy, items, asOf)!;
  const html = renderToStaticMarkup(createElement(PolicyInsights, { policy: resolved, currentId: "event" }));
  assert.equal(html.split("<details")[0].match(/<article/g)?.length, 3);
  assert.ok(html.includes("更多解读 · 2"));
  assert.ok(!html.includes("<details open"));
  assert.ok(!html.includes(original.summaryZh!));
});

test("source identity removes tracking but preserves document-identifying queries", () => {
  assert.equal(sourceKey("https://example.com/?doc=one&utm_source=rss#section"), sourceKey("https://example.com/?doc=one"));
  assert.notEqual(sourceKey("https://example.com/?doc=one"), sourceKey("https://example.com/?doc=two"));
  assert.equal(sourceKey("javascript:alert(1)"), "");
  assert.equal(sourceKey("https://user:password@example.com/document"), "");
});
