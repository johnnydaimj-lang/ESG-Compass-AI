import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { HEAT_LOCATIONS, HEAT_SCENARIOS, HEAT_SOURCE, heatSubsetUrl, type HeatSnapshot } from "../../lib/climate-heat";

async function main() {
  const root = path.join(process.cwd(), "data", "climate");
  const snapshot = JSON.parse(await readFile(path.join(root, "heat-snapshot.json"), "utf8")) as HeatSnapshot;
  const manifest = JSON.parse(await readFile(path.join(root, "heat-evidence-manifest.json"), "utf8")) as Array<{file: string; sha256: string; url: string}>;
  const byFile = new Map(manifest.map((item) => [item.file, item]));
  if (!snapshot.records.length || snapshot.records.length > 6 || byFile.size !== manifest.length || JSON.stringify(snapshot.provenance) !== JSON.stringify(HEAT_SOURCE)) throw new Error("Invalid snapshot or evidence");
  if (process.argv.includes("--require-full") && (snapshot.records.length !== 6 || manifest.length !== 160)) throw new Error("Full two-location/three-scenario acceptance not reached");
  for (const entry of manifest) {
    const raw = await readFile(path.join(root, "evidence", entry.file), "utf8");
    if (createHash("sha256").update(raw).digest("hex") !== entry.sha256) throw new Error("Archive hash mismatch");
  }
  let verified = 0;
  for (const record of snapshot.records) {
    const location = HEAT_LOCATIONS.find((item) => item.id === record.locationId);
    if (!location || !HEAT_SCENARIOS.includes(record.scenario)) throw new Error("Unexpected record");
    for (const [rows, scenario] of [[record.baseline, "historical"], [record.future, record.scenario]] as const) {
      for (const row of rows) {
        const file = [record.locationId, scenario, row.year].join("-") + ".csv";
        const entry = byFile.get(file);
        const raw = await readFile(path.join(root, "evidence", file), "utf8");
        if (!entry || createHash("sha256").update(raw).digest("hex") !== entry.sha256 || entry.url !== heatSubsetUrl(scenario, row.year, location.latitude, location.longitude)) throw new Error("Evidence hash or request mismatch");
        // Independent threshold expression and aggregation, separate from the import parser.
        const samples = raw.trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
        const count = samples.filter((cells) => Number(cells[4]) > 308.15).length;
        if (count !== row.hotDays || samples.length !== row.days) throw new Error("Independent count mismatch: " + file);
        if (samples.some((cells) => Number(cells[2]) !== row.gridLatitude || Number(cells[3]) !== row.gridLongitude)) throw new Error("Coordinate mismatch");
        verified++;
      }
    }
    const baseline = record.baseline.reduce((sum, row) => sum + row.hotDays, 0) / 20;
    const future = record.future.reduce((sum, row) => sum + row.hotDays, 0) / 20;
    console.log(record.locationId, record.scenario, { baseline, future, change: future - baseline });
  }
  console.log("Independent evidence checks:", verified, "(historical years reused across scenarios)");
  console.log("Coverage:", snapshot.records.length, "/ 6 complete windows;", manifest.length, "verified evidence files");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
