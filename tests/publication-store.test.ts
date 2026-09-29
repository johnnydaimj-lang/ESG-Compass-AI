import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("the publication store never falls back to legacy data/contents.json", async () => {
  const dir = mkdtempSync(join(tmpdir(), "esg-store-"));
  const previous = process.cwd();
  try {
    mkdirSync(join(dir, "data"), { recursive: true });
    writeFileSync(join(dir, "data", "contents.json"), JSON.stringify([{ id: "legacy" }]), "utf8");

    process.chdir(dir);
    const store = await import("../lib/publication-store");
    process.chdir(previous);

    assert.deepEqual(store.readPublishedContents(), []);
    assert.equal(store.hasPublicationSnapshot(), false);

    mkdirSync(join(dir, "data", "publication"), { recursive: true });
    writeFileSync(
      join(dir, "data", "publication", "contents.json"),
      JSON.stringify([{ id: "from-snapshot" }]),
      "utf8"
    );
    assert.equal(store.hasPublicationSnapshot(), true);
    assert.deepEqual(store.readPublishedContents(), [{ id: "from-snapshot" }]);
  } finally {
    process.chdir(previous);
    rmSync(dir, { recursive: true, force: true });
  }
});
