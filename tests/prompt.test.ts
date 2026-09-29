import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadPrompt, promptText, promptVersion, renderPrompt } from "../lib/pipeline/prompt";

function fixtureDir(): string {
  return mkdtempSync(join(tmpdir(), "esg-prompt-"));
}

test("loadPrompt reads a named template verbatim", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "base.md"), "hello {{topic}}", "utf8");
    assert.equal(loadPrompt("base", { promptDir: dir }), "hello {{topic}}");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promptText substitutes variables and expands includes", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "partial.md"), "shared rules", "utf8");
    writeFileSync(join(dir, "entry.md"), "intro\n{{> partial}}\ntopic={{topic}}", "utf8");
    const text = promptText("entry", { topic: "ESG" }, { promptDir: dir });
    assert.match(text, /shared rules/);
    assert.match(text, /topic=ESG/);
    assert.doesNotMatch(text, /\{\{/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promptText injects a default site name", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "site.md"), "site={{siteName}}", "utf8");
    assert.equal(promptText("site", {}, { promptDir: dir }), "site=ESG Compass");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("renderPrompt throws when a variable is missing", () => {
  assert.throws(() => renderPrompt("value={{missing}}", {}), /no value for \{\{missing\}\}/);
});

test("loadPrompt throws when the template is missing", () => {
  const dir = fixtureDir();
  try {
    assert.throws(() => loadPrompt("does-not-exist", { promptDir: dir }), /cannot read/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promptText throws when an include target is missing", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "entry.md"), "{{> ghost}}", "utf8");
    assert.throws(() => promptText("entry", {}, { promptDir: dir }), /cannot read/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promptText throws on an include cycle", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "a.md"), "{{> b}}", "utf8");
    writeFileSync(join(dir, "b.md"), "{{> a}}", "utf8");
    assert.throws(() => promptText("a", {}, { promptDir: dir }), /include cycle/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promptVersion changes when an included partial changes", () => {
  const dir = fixtureDir();
  try {
    writeFileSync(join(dir, "entry.md"), "{{> partial}}", "utf8");
    writeFileSync(join(dir, "partial.md"), "v1", "utf8");
    const first = promptVersion("entry", { promptDir: dir });
    writeFileSync(join(dir, "partial.md"), "v2", "utf8");
    const second = promptVersion("entry", { promptDir: dir });
    assert.match(first, /^entry@[0-9a-f]{12}$/);
    assert.notEqual(first, second);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
