import assert from "node:assert/strict";
import test from "node:test";

import type { ScoreAxes, ScoreRun } from "../lib/contracts/pipeline";
import { decideSelection, scoreFromAxes } from "../lib/pipeline/score";

const zeroAxes: ScoreAxes = {
  significance: 0,
  novelty: 0,
  credibility: 0,
  resonance: 0,
  actionability: 0,
};

function run(score: number): ScoreRun {
  return { score, axes: zeroAxes };
}

test("scoreFromAxes applies per-type weights and clamps to 0-10", () => {
  const mid: ScoreAxes = {
    significance: 5,
    novelty: 5,
    credibility: 5,
    resonance: 5,
    actionability: 5,
  };
  assert.equal(scoreFromAxes("政策", mid), 50);
  assert.equal(scoreFromAxes("政策", { ...mid, significance: 99 }), 65);
  assert.equal(scoreFromAxes("政策", { ...mid, significance: -5 }), 35);
});

test("decideSelection floors the display score", () => {
  const decision = decideSelection([run(63), run(64)], "T1");
  assert.equal(decision.displayScore, 63);
});

test("decideSelection requires the summed score to reach twice the threshold", () => {
  const pass = decideSelection([run(60), run(60)], "T1");
  const fail = decideSelection([run(58), run(61)], "T1");
  assert.equal(pass.selected, true);
  assert.equal(pass.threshold, 60);
  assert.equal(fail.selected, false);
});

test("decideSelection enforces the understand floor on both runs", () => {
  const decision = decideSelection([run(44), run(76)], "T1");
  assert.equal(decision.selected, false);
  assert.equal(decision.understandFloor, 45);
});

test("SIGNAL sources never enter the selection set", () => {
  const decision = decideSelection([run(100), run(100)], "SIGNAL");
  assert.equal(decision.selected, false);
  assert.match(decision.reason, /信号源/);
});
