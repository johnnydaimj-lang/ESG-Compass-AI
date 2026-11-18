import assert from "node:assert/strict";
import test from "node:test";
import { HEAT_SOURCE, heatSubsetUrl, parseHeatCsv, selectHeat, summarizeHeat, type HeatRecord } from "../lib/climate-heat";

const header = 'time,station,latitude[unit="degrees_north"],longitude[unit="degrees_east"],tasmax[unit="K"]';
function csv(year: number) {
  const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  return header + "\n" + Array.from({ length: days }, (_, i) => new Date(Date.UTC(year, 0, i + 1)).toISOString().slice(0, 10) + "T12:00:00Z,point,31.125,121.375," + (i === 0 ? "309.15" : "308.15")).join("\n");
}
test("daily Kelvin values use strict above-35C threshold and leap-year completeness", () => {
  assert.equal(parseHeatCsv(csv(2000), 2000).days, 366);
  assert.equal(parseHeatCsv(csv(2000), 2000).hotDays, 1);
  assert.equal(parseHeatCsv(csv(2001), 2001).days, 365);
});
test("missing values, units, truncated and repeated days are rejected", () => {
  const raw = csv(2001);
  assert.throws(() => parseHeatCsv(raw.replace("309.15", "-999"), 2001));
  assert.throws(() => parseHeatCsv(raw.replace('unit="K"', 'unit="C"'), 2001));
  assert.throws(() => parseHeatCsv(raw.split("\n").slice(0, -1).join("\n"), 2001));
  assert.throws(() => parseHeatCsv(raw.replace("2001-01-02", "2001-01-01"), 2001));
});
const base = parseHeatCsv(csv(2001), 2001);
const record: HeatRecord = {
  locationId: "test", latitude: 31.23, longitude: 121.47, scenario: "ssp245", fetchedAt: "2026-11-18",
  baseline: Array.from({ length: 20 }, (_, i) => ({ ...base, year: 1995 + i, days: (Date.UTC(1996 + i, 0, 1) - Date.UTC(1995 + i, 0, 1)) / 86400000, hotDays: 10 })),
  future: Array.from({ length: 20 }, (_, i) => ({ ...base, year: 2041 + i, days: (Date.UTC(2042 + i, 0, 1) - Date.UTC(2041 + i, 0, 1)) / 86400000, hotDays: 30 })),
};
test("mean counts compare complete windows on the same grid without inventing uncertainty", () => {
  assert.equal(summarizeHeat(record).change, 20);
  assert.throws(() => summarizeHeat({ ...record, baseline: record.baseline.slice(1) }));
  assert.throws(() => summarizeHeat({ ...record, future: record.future.map((row) => ({ ...row, gridLatitude: 10 })) }));
});
test("public lookup rejects invalid queries and never substitutes another reference grid", () => {
  const snapshot = { schemaVersion: 1 as const, provenance: HEAT_SOURCE, records: [record] };
  const query = new URLSearchParams("lat=31.23&lon=121.47&scenario=ssp245&window=2041–2060&variable=tasmax");
  assert.equal(selectHeat(snapshot, query).status, "available");
  query.set("lat", "0");
  assert.equal(selectHeat(snapshot, query).status, "unavailable");
  query.set("lat", "");
  assert.throws(() => selectHeat(snapshot, query));
});
test("raw requests fix source host, variable, member and dataset version", () => {
  const url = new URL(heatSubsetUrl("ssp585", 2050, 31.23, 121.47));
  assert.equal(url.host, "ds.nccs.nasa.gov");
  assert.ok(url.pathname.endsWith("_2050_v2.0.nc"));
  assert.equal(url.searchParams.get("var"), "tasmax");
  assert.throws(() => heatSubsetUrl("https://example.com", 2050, 0, 0));
});
