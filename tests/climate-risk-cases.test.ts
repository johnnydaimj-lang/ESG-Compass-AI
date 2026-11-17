import assert from "node:assert/strict";
import test from "node:test";
import {
  CLIMATE_RISK_CASES,
  sortClimateRiskCases,
  type ClimateCaseRisk,
  type ClimateRiskCase,
} from "../lib/climate-risk-cases";

const RISK_KEYS: ClimateCaseRisk[] = ["rain", "heat", "sea", "carbon", "technology"];

test("the rolling case sample covers every climate lab risk with first-party evidence", () => {
  for (const riskKey of RISK_KEYS) {
    const matches = CLIMATE_RISK_CASES.filter((item) => item.riskKeys.includes(riskKey));
    assert.ok(matches.length > 0, `${riskKey} should have at least one case`);
    assert.ok(matches.every((item) => item.href.startsWith("https://")));
    assert.ok(matches.every((item) => item.evidenceLabel.length > 0));
  }
});

test("the prototype cases stay inside the documented rolling five-year window", () => {
  const windowStart = "2021-11-17";
  assert.ok(CLIMATE_RISK_CASES.every((item) => item.occurredAt >= windowStart));
});

test("case sorting keeps relevance, impact and time as separate choices", () => {
  const fixtures: ClimateRiskCase[] = [
    { ...CLIMATE_RISK_CASES[0], id: "older-relevant", riskKeys: ["heat"], relevanceScore: 99, impactLevel: 3, occurredAt: "2023-01-01" },
    { ...CLIMATE_RISK_CASES[0], id: "newer-impactful", riskKeys: ["heat"], relevanceScore: 90, impactLevel: 5, occurredAt: "2025-01-01" },
  ];

  assert.equal(sortClimateRiskCases(fixtures, "heat", "relevance")[0].id, "older-relevant");
  assert.equal(sortClimateRiskCases(fixtures, "heat", "impact")[0].id, "newer-impactful");
  assert.equal(sortClimateRiskCases(fixtures, "heat", "latest")[0].id, "newer-impactful");
});
