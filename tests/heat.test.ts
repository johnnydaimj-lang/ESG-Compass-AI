import assert from "node:assert/strict";
import test from "node:test";

import type { HeatEvidence, SourceTier } from "../lib/contracts/pipeline";
import { calculateHeat } from "../lib/pipeline/heat";

const now = new Date("2026-09-29T12:00:00Z");

function hoursAgo(hours: number): string {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

function evidence(
  sourceId: string,
  hours: number,
  sourceTier: SourceTier = "T1",
  editorialSource = false
): HeatEvidence {
  return { sourceId, sourceTier, editorialSource, publishedAt: hoursAgo(hours) };
}

test("a single participant never becomes a hot story", () => {
  const result = calculateHeat([evidence("src-a", 1, "T1", true)], now);
  assert.equal(result.score, 0);
  assert.equal(result.participants, 1);
});

test("duplicate mentions from one source count once", () => {
  const result = calculateHeat(
    [evidence("src-a", 1, "T1", true), evidence("src-a", 2, "T1", true)],
    now
  );
  assert.equal(result.participants, 1);
  assert.equal(result.score, 0);
});

test("at least one editorial source is required", () => {
  const result = calculateHeat(
    [evidence("src-a", 1, "T1", false), evidence("src-b", 1, "T1_5", false)],
    now
  );
  assert.equal(result.editorialParticipants, 0);
  assert.equal(result.score, 0);
});

test("two independent sources including an editorial one score above zero", () => {
  const result = calculateHeat(
    [evidence("src-a", 1, "T1", true), evidence("src-b", 2, "T1_5", false)],
    now
  );
  assert.equal(result.participants, 2);
  assert.equal(result.editorialParticipants, 1);
  assert.ok(result.score > 0);
});

test("evidence outside the 48 hour window is ignored", () => {
  const result = calculateHeat(
    [evidence("src-a", 1, "T1", true), evidence("src-b", 72, "T1_5", false)],
    now
  );
  assert.equal(result.participants, 1);
  assert.equal(result.score, 0);
});
