import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentItem } from "../lib/contracts/content";
import { resolvePolicyContext, sourceKey, policyRelationsForEvent, type PolicyContext } from "../lib/policy-context";
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
  assert.equal(insights, ""); // An interpretation never recommends itself.
  const eu = resolvePolicyContext(seed.matters[1].policy, contents, asOf)!;
  assert.equal(eu.insights.length, 0);
  assert.equal(renderToStaticMarkup(createElement(PolicyInsights, { policy: eu, currentId: "src-iauei6" })), "");
});

test("policy and interpretation resolve the same reviewed relation without any progress entries", () => {
  const event = { ...original, id: "policy-event", articleUrl: "https://example.com/policy-event" };
  const policy = { ...uk, eventIds: [event.id] };
  const snapshot = { version: 1, matters: [{ id: "policy", policy, entries: [] }] };
  const items = [...contents, event];
  const forward = policyRelationsForEvent(snapshot, items, event.id, asOf);
  const reverse = policyRelationsForEvent(snapshot, items, original.id, asOf);
  assert.equal(forward[0].isInterpretation, false);
  assert.equal(reverse[0].isInterpretation, true);
  assert.equal(forward[0].policy.document.url, reverse[0].policy.document.url);
  assert.equal(forward[0].policy.insights[0].contentId, original.id);
  assert.ok(renderToStaticMarkup(createElement(PolicyInsights, { policy: forward[0].policy, currentId: event.id })).includes("阅读解读"));
  assert.ok(renderToStaticMarkup(createElement(PolicySource, { policy: reverse[0].policy, item: original, isInterpretation: true })).includes("解读对应的政策／法规"));
  assert.deepEqual(policyRelationsForEvent(snapshot, items, "missing", asOf), []);
  assert.deepEqual(policyRelationsForEvent({ version: 2, matters: snapshot.matters }, items, event.id, asOf), []);
});

test("one interpretation may explicitly refer to multiple policies; irrelevant items do not match", () => {
  const other = { ...uk, document: { ...uk.document, url: uk.document.url + "?version=second" } };
  const snapshot = { version: 1, matters: [{ id: "one", policy: uk }, { id: "two", policy: other }] };
  assert.equal(policyRelationsForEvent(snapshot, contents, original.id, asOf).length, 2);
  assert.deepEqual(policyRelationsForEvent(snapshot, contents, "src-iauei6", asOf), []);
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
