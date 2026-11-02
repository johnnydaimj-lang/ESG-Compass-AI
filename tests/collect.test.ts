import assert from "node:assert/strict";
import test from "node:test";

import { extractArticleMetadata, extractDate, isExcludedArticleUrl, isPlausiblePublishedDate } from "../lib/pipeline/collect";

const NOW = Date.UTC(2026, 10, 2, 12);

test("extractDate ignores future deadlines and chooses the latest plausible date", () => {
  const text = "Published October 29, 2026. Comments are due January 18, 2027.";
  assert.equal(extractDate(text, NOW), "2026-10-29");
});

test("extractDate supports day-first English dates", () => {
  assert.equal(extractDate("29 October 2026", NOW), "2026-10-29");
  assert.equal(extractDate("Yerevan, Oct. 30, 2026", NOW), "2026-10-30");
  assert.equal(extractDate("2 Oct, 2026", NOW), "2026-10-02");
});

test("extractDate rejects impossible calendar dates", () => {
  assert.equal(extractDate("2026-02-31", NOW), null);
  assert.equal(extractDate("September 31, 2026", NOW), null);
});

test("published timestamps more than one day in the future are implausible", () => {
  assert.equal(isPlausiblePublishedDate("2026-11-03T00:00:00.000Z", NOW), true);
  assert.equal(isPlausiblePublishedDate("2027-01-18T00:00:00.000Z", NOW), false);
});

test("webinar and event paths are excluded from news collection", () => {
  assert.equal(
    isExcludedArticleUrl("https://example.com/en/knowledge/webinars-and-events/123/session"),
    true,
  );
  assert.equal(isExcludedArticleUrl("https://example.com/en/insights/article", "Webinar: Test"), true);
  assert.equal(isExcludedArticleUrl("https://example.com/en/insights/article"), false);
});

test("article metadata prefers JSON-LD and OpenGraph values", () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Fallback title">
      <meta name="description" content="Fallback summary">
      <script type="application/ld+json">
        {"@type":"Article","headline":"Metadata title","description":"Metadata summary","datePublished":"2026-10-30T09:00:00Z"}
      </script>
    </head><body><h1>Page title</h1></body></html>
  `;
  assert.deepEqual(extractArticleMetadata(html, NOW), {
    title: "Metadata title",
    summary: "Metadata summary",
    publishedAt: "2026-10-30T09:00:00.000Z",
  });
});

test("article metadata reads embedded CMS publishing dates", () => {
  const html = `
    <html><head><meta property="og:title" content="CMS report"></head>
    <body><script>window.page = {"datePublished":"01 Oct 2025"};</script></body></html>
  `;
  assert.equal(extractArticleMetadata(html, NOW).publishedAt, "2025-10-01T00:00:00.000Z");
});

test("article metadata can prefer the document signing date in the body", () => {
  const html = `
    <html><head><meta property="og:title" content="CSRC notice"></head>
    <body><p>中国证监会</p><p>2026年10月26日</p></body></html>
  `;
  assert.equal(extractArticleMetadata(html, NOW, true).publishedAt, "2026-10-26T00:00:00.000Z");
});
