import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { HEAT_LOCATIONS, HEAT_SCENARIOS, HEAT_SOURCE, heatSubsetUrl, parseHeatCsv, summarizeHeat, type HeatYear, type HeatSnapshot } from "../../lib/climate-heat";

// This offline importer writes only climate evidence and a validated snapshot.
const root = path.join(process.cwd(), "data", "climate");
const evidence = path.join(root, "evidence");
async function main() {
const cacheOnly = process.argv.includes("--cache-only");
await mkdir(evidence, { recursive: true });
const snapshot: HeatSnapshot = { schemaVersion: 1, provenance: HEAT_SOURCE, records: [] };
const manifest: Array<{ file: string; url: string; sha256: string; fetchedAt: string }> = [];
async function yearData(location: typeof HEAT_LOCATIONS[number], scenario: string, year: number): Promise<HeatYear> {
  const file = `${location.id}-${scenario}-${year}.csv`;
  const url = heatSubsetUrl(scenario, year, location.latitude, location.longitude);
  let csv: string;
  let fetchedAt: string;
  try {
    const saved = JSON.parse(await readFile(path.join(evidence, file + ".meta.json"), "utf8"));
    csv = await readFile(path.join(evidence, file), "utf8");
    if (saved.url !== url || saved.sha256 !== createHash("sha256").update(csv).digest("hex")) throw new Error("Evidence mismatch");
    fetchedAt = saved.fetchedAt;
  } catch {
    if (cacheOnly) throw new Error("Not in verified cache");
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(90000), redirect: "error" });
        if (!response.ok) {
          if (response.status === 503 || response.status === 429) throw new Error("NASA service unavailable; pause collection");
          throw new Error("NASA HTTP " + response.status);
        }
        csv = await response.text();
        parseHeatCsv(csv, year);
        fetchedAt = new Date().toISOString();
        const sha256 = createHash("sha256").update(csv).digest("hex");
        await writeFile(path.join(evidence, file), csv);
        await writeFile(path.join(evidence, file + ".meta.json"), JSON.stringify({ url, fetchedAt, sha256 }) + "\n");
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message.includes("pause collection")) throw error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
    if (lastError) throw lastError;
  }
  const parsed = parseHeatCsv(csv!, year);
  manifest.push({ file, url, sha256: createHash("sha256").update(csv!).digest("hex"), fetchedAt: fetchedAt! });
  return parsed;
}
const jobs = HEAT_LOCATIONS.flatMap((location) => ["historical", ...HEAT_SCENARIOS].flatMap((scenario) =>
  Array.from({ length: 20 }, (_, index) => ({ location, scenario, year: (scenario === "historical" ? 1995 : 2041) + index }))));
const results = new Map<string, HeatYear>();
const failures: string[] = [];
let nextJob = 0;
let upstreamPaused = false;
// A bounded worker pool keeps four requests active without waiting on batch stragglers.
await Promise.all(Array.from({ length: 4 }, async () => {
  while (nextJob < jobs.length && !upstreamPaused) {
    const job = jobs[nextJob++];
    const key = [job.location.id, job.scenario, job.year].join("|");
    try {
      results.set(key, await yearData(job.location, job.scenario, job.year));
      console.log("Validated", results.size, "/", jobs.length, key);
    } catch (error) {
      failures.push(key);
      if (error instanceof Error && error.message.includes("pause collection")) upstreamPaused = true;
      if (!cacheOnly) console.error("Unavailable", key, error instanceof Error ? error.message : "fetch failed");
    }
  }
}));
function windowData(location: typeof HEAT_LOCATIONS[number], scenario: string, start: number) {
  const rows = Array.from({ length: 20 }, (_, i) => results.get([location.id, scenario, start + i].join("|")));
  return rows.every((row) => row !== undefined) ? rows as HeatYear[] : undefined;
}
for (const location of HEAT_LOCATIONS) {
  const baseline = windowData(location, "historical", 1995);
  if (!baseline) continue;
  for (const scenario of HEAT_SCENARIOS) {
    const future = windowData(location, scenario, 2041);
    if (!future) continue;
    const fetchedAt = manifest.filter((entry) => entry.file.startsWith(location.id + "-historical-") || entry.file.startsWith(location.id + "-" + scenario + "-")).map((entry) => entry.fetchedAt).sort().at(-1)!;
    const record = { locationId: location.id, latitude: location.latitude, longitude: location.longitude, scenario, baseline, future, fetchedAt };
    summarizeHeat(record);
    snapshot.records.push(record);
  }
}
if (!snapshot.records.length) throw new Error("No complete windows; previous snapshot preserved");
try {
  const previous = JSON.parse(await readFile(path.join(root, "heat-snapshot.json"), "utf8")) as HeatSnapshot;
  if (JSON.stringify(previous.provenance) === JSON.stringify(HEAT_SOURCE)) {
    for (const old of previous.records) if (!snapshot.records.some((item) => item.locationId === old.locationId && item.scenario === old.scenario)) snapshot.records.push(old);
  }
} catch { /* No previous snapshot to preserve. */ }
await writeFile(path.join(root, "heat-evidence-manifest.json"), JSON.stringify(manifest.sort((a, b) => a.file.localeCompare(b.file)), null, 2) + "\n");
await writeFile(path.join(root, "heat-snapshot.tmp.json"), JSON.stringify(snapshot, null, 2) + "\n");
await rename(path.join(root, "heat-snapshot.tmp.json"), path.join(root, "heat-snapshot.json"));
await writeFile(path.join(root, "collection-status.json"), JSON.stringify({ generatedAt: new Date().toISOString(), mode: cacheOnly ? "cache-only" : "network", state: snapshot.records.length === 6 ? "complete" : "partial", expectedWindows: 6, availableWindows: snapshot.records.length, validatedFiles: manifest.length, upstreamPaused, missingWindows: HEAT_LOCATIONS.flatMap((location) => HEAT_SCENARIOS.filter((scenario) => !snapshot.records.some((record) => record.locationId === location.id && record.scenario === scenario)).map((scenario) => location.id + "|" + scenario)) }, null, 2) + "\n");
console.log("Validated snapshot:", snapshot.records.length, "records;", manifest.length, "raw evidence files");
if (!cacheOnly && upstreamPaused) console.log("Upstream paused after 429/503; complete prior windows retained. Retry later.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Climate import failed"); process.exitCode = 1; });
