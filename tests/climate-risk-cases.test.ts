import assert from "node:assert/strict";
import test from "node:test";
import {
  CLIMATE_RISK_CASES,
  sortClimateRiskCases,
  type ClimateCaseRisk,
  type ClimateRiskCase,
} from "../lib/climate-risk-cases";

test("case evidence does not force wildfire into heat or hurricanes into sea-level rise", () => {
  assert.ok(CLIMATE_RISK_CASES.every((item) => item.href.startsWith("https://") && item.evidenceLabel.length > 0));
  const fires = CLIMATE_RISK_CASES.filter((item) => item.id.includes("wildfire"));
  assert.ok(fires.every((item) => item.riskKeys.includes("wildfire") && !item.riskKeys.includes("heat")));
  assert.ok(!CLIMATE_RISK_CASES.find((item) => item.id === "hci-hurricanes-2024")?.riskKeys.includes("sea"));
});

test("case selection excludes out-of-window and future events using an injected clock", () => {
  const fixtures = ["2021-11-17", "2021-11-18", "2026-11-18", "2026-11-19"].map((date) => ({ ...CLIMATE_RISK_CASES[0], occurredAt: date, riskKeys: ["heat"] as ClimateCaseRisk[] }));
  assert.deepEqual(sortClimateRiskCases(fixtures, "heat", "latest", new Date("2026-11-18T12:00:00Z")).map((item) => item.occurredAt), ["2026-11-18", "2021-11-18"]);
});

test("case sorting keeps relevance, impact and time as separate choices", () => {
  const fixtures: ClimateRiskCase[] = [
    { ...CLIMATE_RISK_CASES[0], id: "older-relevant", riskKeys: ["heat"], relevanceScore: 99, impactLevel: 3, occurredAt: "2023-01-01" },
    { ...CLIMATE_RISK_CASES[0], id: "newer-impactful", riskKeys: ["heat"], relevanceScore: 90, impactLevel: 5, occurredAt: "2025-01-01" },
  ];

  const now = new Date("2026-11-18T00:00:00Z");
  assert.equal(sortClimateRiskCases(fixtures, "heat", "relevance", now)[0].id, "older-relevant");
  assert.equal(sortClimateRiskCases(fixtures, "heat", "impact", now)[0].id, "newer-impactful");
  assert.equal(sortClimateRiskCases(fixtures, "heat", "latest", now)[0].id, "newer-impactful");
});
