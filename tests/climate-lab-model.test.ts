import assert from "node:assert/strict";
import test from "node:test";
import { calculateCarbon, calculateOperations, SCENARIO_CATALOG } from "../lib/climate-lab-model";

test("single-event adaptation keeps investment separate from avoided interruption", () => {
  const result = calculateOperations({ downtimeDays: 10, protectedDays: 3, dailyMargin: 10, repairCost: 20, adaptationCost: 40 });
  assert.deepEqual(result, { before: 120, after: 90, avoidedInterruption: 30, firstEventBalance: -10 });
});
test("avoided downtime is capped and repair costs survive zero downtime", () => {
  assert.equal(calculateOperations({ downtimeDays: 1, protectedDays: 5, dailyMargin: 10, repairCost: 20, adaptationCost: 0 }).after, 20);
});
test("carbon costs use covered emissions and permit a negative price difference", () => {
  assert.deepEqual(calculateCarbon(10000, 40, 60, 90), { baseCost: 360000, stressCost: 540000, delta: 180000 });
  assert.equal(calculateCarbon(10000, 100, 60, 90).delta, 0);
  assert.ok(calculateCarbon(10000, 0, 90, 60).delta < 0);
});
test("invalid monetary and share inputs cannot produce numeric output", () => {
  assert.throws(() => calculateCarbon(NaN, 40, 60, 90));
  assert.throws(() => calculateCarbon(100, 101, 60, 90));
  assert.throws(() => calculateOperations({ downtimeDays: -1, protectedDays: 0, dailyMargin: 1, repairCost: 0, adaptationCost: 0 }));
});
test("scenario versions do not mix old IEA editions with WEO2025", () => {
  assert.deepEqual(SCENARIO_CATALOG.iea.scenarios.map((item) => item.id), ["cps", "steps", "nze"]);
  assert.equal(SCENARIO_CATALOG.ipcc.scenarios.length, 3);
  assert.equal(SCENARIO_CATALOG.ngfs.scenarios.length, 3);
});
