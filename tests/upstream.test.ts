import assert from "node:assert/strict";
import test from "node:test";

import { extractUpstreamLinks } from "../lib/upstream";

test("extractUpstreamLinks keeps official links and drops self/social/assets", () => {
  const html = `
    <a href="https://www.esgtoday.com/internal">internal</a>
    <a href="https://twitter.com/esgtoday">twitter</a>
    <a href="https://www.esgtoday.com/image.jpg">image</a>
    <a href="https://finance.ec.europa.eu/publications/x">EU</a>
    <a href="https://www.eurosif.org/news/y">Eurosif</a>
    <a href="https://finance.ec.europa.eu/publications/x#section">EU duplicate</a>
  `;
  const refs = extractUpstreamLinks(html, "https://www.esgtoday.com/article/");

  assert.deepEqual(refs.map((ref) => ref.sourceName), ["欧盟委员会", "Eurosif"]);
  assert.equal(new Set(refs.map((ref) => ref.sourceUrl)).size, refs.length);
});

test("extractUpstreamLinks can drop secondhand news domains", () => {
  const html = `
    <a href="https://www.reuters.com/business/x">Reuters</a>
    <a href="https://www.sec.gov/news/press-release/x">SEC</a>
  `;
  const refs = extractUpstreamLinks(html, "https://www.esgtoday.com/article/");

  assert.deepEqual(refs.map((ref) => ref.sourceName), ["美国 SEC"]);
});

