import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { ContentItem } from "../lib/contracts/content";
import { resolveProgress, type ProgressMatter } from "../lib/event-progress";
import EventProgress from "../components/EventProgress";

const contents = JSON.parse(readFileSync("data/publication/contents.json", "utf8")) as ContentItem[];
const seed = JSON.parse(readFileSync("data/publication/event-progress.json", "utf8"));
const baseline = contents.find((item) => item.id === "src-fu90e2")!;
function fixture(count: number) {
  const items = Array.from({ length: count }, (_, index) => ({ ...baseline, id: `item-${index}`,
    articleUrl: `https://example.com/${index}`, publishedAt: `2026-11-${String(index + 1).padStart(2, "0")}T00:00:00Z` }));
  const matter: ProgressMatter = { id: "matter", title: "测试事项", region: "英国", zoneIds: ["labor-human-rights"], selfChecks: [],
    entries: items.map((item, index) => ({ id: `step-${index}`, contentId: item.id, stage: "草案", change: `具体变化 ${index}` })) };
  return { items, matter, snapshot: { version: 1, matters: [matter] } };
}

test("reviewed publication records resolve, point to existing zones and keep originals intact", () => {
  const before = JSON.stringify(contents);
  const zones = JSON.parse(readFileSync("data/zones.json", "utf8")).zones.map((zone: { id: string }) => zone.id);
  const result = resolveProgress(seed, contents);
  assert.equal(result.length, 2);
  for (const matter of result) {
    assert.equal(matter.entries.length, 1);
    assert.ok(matter.zoneIds.every((id) => zones.includes(id)));
    assert.ok(matter.href.endsWith("#event-progress"));
  }
  assert.equal(result.find((matter) => matter.id.startsWith("uk-"))!.entries[0].date, "2026-11-04");
  assert.equal(JSON.stringify(contents), before);
});

test("missing, low-quality and duplicate content cannot become milestones", () => {
  const { items, matter, snapshot } = fixture(3);
  items[1] = { ...items[1], pipeline: { ...items[1].pipeline!, score: 1 } };
  items[2].articleUrl = items[0].articleUrl;
  matter.entries.push({ ...matter.entries[0] }, { ...matter.entries[0], id: "duplicate" },
    { ...matter.entries[0], id: "missing", contentId: "missing" });
  assert.equal(resolveProgress(snapshot, items)[0].entries.length, 1);
  assert.deepEqual(resolveProgress({ version: 1, matters: [{ ...matter, entries: [] }] }, items), []);
});

test("invalid snapshots and ambiguous membership fail closed", () => {
  const { items, matter, snapshot } = fixture(1);
  for (const value of [null, {}, { version: 2, matters: [] }, { version: 1, matters: [null, {}, { ...matter, entries: [null] }] }]) {
    assert.deepEqual(resolveProgress(value, items), []);
  }
  snapshot.matters.push({ ...matter, id: "other" });
  assert.deepEqual(resolveProgress(snapshot, items), []);
});

test("event date is explicit; deadlines and impossible dates do not become events", () => {
  const { items, matter, snapshot } = fixture(1);
  assert.equal(resolveProgress(snapshot, items)[0].entries[0].dateLabel, "报道日期");
  for (const date of ["2027-01-18", "2026-02-30", "unknown"]) {
    matter.entries[0].occurredOn = date;
    assert.deepEqual(resolveProgress(snapshot, items), []);
  }
});

test("newest three entries are visible; remaining entries use native disclosure", () => {
  const { items, snapshot } = fixture(5);
  const matter = resolveProgress(snapshot, items)[0];
  assert.equal(matter.entries[0].contentId, "item-4");
  assert.equal(matter.href, "/events/item-4#event-progress");
  const html = renderToStaticMarkup(createElement(EventProgress, { matter, currentId: "item-0" }));
  assert.equal(html.split("<details")[0].match(/border-l-2/g)?.length, 3);
  assert.ok(html.includes("展开更早 2 条进展"));
  assert.ok(!html.includes("<details open"));
  const single = renderToStaticMarkup(createElement(EventProgress, { matter: resolveProgress(seed, contents)[0], currentId: "src-fu90e2" }));
  assert.ok(!single.includes("进展记录"));
  assert.ok(!single.includes("<details"));
});
