export const HEAT_SOURCE = {
  dataset: "NASA NEX-GDDP-CMIP6",
  version: "v2.0",
  model: "ACCESS-CM2",
  member: "r1i1p1f1",
  variable: "tasmax",
  resolution: "0.25° × 0.25°",
  thresholdC: 35,
  baseline: [1995, 2014],
  future: [2041, 2060],
  sourceUrl: "https://www.nccs.nasa.gov/data-collections/nex-gddp-cmip6/",
  license: "CC0",
  licenseUrl: "https://registry.opendata.aws/nex-gddp-cmip6/",
} as const;
export const HEAT_LOCATIONS = [
  { id: "shanghai", label: "上海参考点", latitude: 31.23, longitude: 121.47 },
  { id: "rotterdam", label: "鹿特丹参考点", latitude: 51.92, longitude: 4.48 },
] as const;
export const HEAT_SCENARIOS = ["ssp126", "ssp245", "ssp585"] as const;
export type HeatScenario = typeof HEAT_SCENARIOS[number];
export interface HeatYear {
  year: number;
  days: number;
  hotDays: number;
  gridLatitude: number;
  gridLongitude: number;
}
export interface HeatRecord {
  locationId: string;
  latitude: number;
  longitude: number;
  scenario: HeatScenario;
  baseline: HeatYear[];
  future: HeatYear[];
  fetchedAt: string;
}
export interface HeatSnapshot {
  schemaVersion: 1;
  provenance: typeof HEAT_SOURCE;
  records: HeatRecord[];
}
export function heatSubsetUrl(scenario: string, year: number, lat: number, lon: number) {
  if (!["historical", ...HEAT_SCENARIOS].includes(scenario)) throw new Error("Unsupported scenario");
  const file = `tasmax_day_ACCESS-CM2_${scenario}_r1i1p1f1_gn_${year}_v2.0.nc`;
  const url = new URL(`https://ds.nccs.nasa.gov/thredds/ncss/grid/AMES/NEX/GDDP-CMIP6/ACCESS-CM2/${scenario}/r1i1p1f1/tasmax/${file}`);
  url.search = new URLSearchParams({ var: "tasmax", latitude: String(lat), longitude: String(lon), time_start: `${year}-01-01T00:00:00Z`, time_end: `${year}-12-31T23:59:59Z`, accept: "csv" }).toString();
  return url.toString();
}

// Reject partial years, missing sentinels, unexpected units and shifting grid cells.
export function parseHeatCsv(csv: string, year: number): HeatYear {
  const lines = csv.trim().split(/\r?\n/);
  if (lines[0] !== 'time,station,latitude[unit="degrees_north"],longitude[unit="degrees_east"],tasmax[unit="K"]') throw new Error("Unexpected NASA CSV schema or unit");
  const expected = new Date(Date.UTC(year + 1, 0, 1)).getTime() - new Date(Date.UTC(year, 0, 1)).getTime();
  const expectedDays = expected / 86400000;
  if (lines.length - 1 !== expectedDays) throw new Error("Incomplete Gregorian year");
  let hotDays = 0;
  let gridLatitude = NaN;
  let gridLongitude = NaN;
  for (let index = 1; index < lines.length; index++) {
    const columns = lines[index].split(",");
    if (columns.length !== 5) throw new Error("Invalid daily row");
    const expectedDate = new Date(Date.UTC(year, 0, index)).toISOString().slice(0, 10);
    if (columns[0] !== expectedDate + "T12:00:00Z") throw new Error("Missing, duplicate or unordered day");
    const latitude = Number(columns[2]);
    const longitude = Number(columns[3]);
    const kelvin = Number(columns[4]);
    if (columns.slice(2).some((value) => value.trim() === "") || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !Number.isFinite(kelvin) || kelvin < 150 || kelvin > 350) throw new Error("Missing or invalid temperature/coordinates");
    if (index > 1 && (latitude !== gridLatitude || longitude !== gridLongitude)) throw new Error("Grid changed during year");
    gridLatitude = latitude;
    gridLongitude = longitude;
    if (kelvin - 273.15 > HEAT_SOURCE.thresholdC) hotDays++;
  }
  return { year, days: expectedDays, hotDays, gridLatitude, gridLongitude };
}

export function summarizeHeat(record: HeatRecord) {
  for (const [rows, range] of [[record.baseline, HEAT_SOURCE.baseline], [record.future, HEAT_SOURCE.future]] as const) {
    if (rows.length !== 20 || rows.some((row, i) => row.year !== range[0] + i || row.days !== (Date.UTC(row.year + 1, 0, 1) - Date.UTC(row.year, 0, 1)) / 86400000 || !Number.isInteger(row.hotDays) || row.hotDays < 0 || row.hotDays > row.days || !Number.isFinite(row.gridLatitude) || !Number.isFinite(row.gridLongitude))) throw new Error("Invalid climate window");
  }
  const all = [...record.baseline, ...record.future];
  if (all.some((row) => row.gridLatitude !== all[0].gridLatitude || row.gridLongitude !== all[0].gridLongitude)) throw new Error("Mismatched spatial grid");
  const baselineMean = record.baseline.reduce((sum, row) => sum + row.hotDays, 0) / 20;
  const futureMean = record.future.reduce((sum, row) => sum + row.hotDays, 0) / 20;
  return { baselineMean, futureMean, change: futureMean - baselineMean, gridLatitude: all[0].gridLatitude, gridLongitude: all[0].gridLongitude };
}

export function selectHeat(snapshot: HeatSnapshot, query: URLSearchParams) {
  const coordinate = (key: string, limit: number) => {
    const raw = query.get(key);
    if (raw === null || raw.trim() === "" || query.getAll(key).length !== 1) throw new Error("Invalid coordinate");
    const value = Number(raw);
    if (!Number.isFinite(value) || Math.abs(value) > limit) throw new Error("Invalid coordinate");
    return value;
  };
  const lat = coordinate("lat", 90);
  const lon = coordinate("lon", 180);
  const scenario = query.get("scenario");
  const window = query.get("window");
  if (!HEAT_SCENARIOS.includes(scenario as HeatScenario) || !["2021–2040", "2041–2060", "2081–2100"].includes(window ?? "") || query.get("variable") !== "tasmax") throw new Error("Invalid climate query");
  if (window !== "2041–2060") return { status: "unavailable" as const, message: "此时间窗尚未完成数据验证。请选2041–2060，或继续查看情景说明。" };
  if (JSON.stringify(snapshot.provenance) !== JSON.stringify(HEAT_SOURCE) || snapshot.schemaVersion !== 1) throw new Error("Invalid snapshot provenance");
  const record = snapshot.records.find((item) => {
    const grid = item.baseline[0];
    return item.scenario === scenario && grid && lat >= grid.gridLatitude - 0.125 && lat < grid.gridLatitude + 0.125 && lon >= grid.gridLongitude - 0.125 && lon < grid.gridLongitude + 0.125;
  });
  if (!record) {
    const coverage = snapshot.records.map((item) => (HEAT_LOCATIONS.find((location) => location.id === item.locationId)?.label ?? item.locationId) + " / " + ({ ssp126: "SSP1-2.6", ssp245: "SSP2-4.5", ssp585: "SSP5-8.5" }[item.scenario])).join("；");
    return { status: "unavailable" as const, message: "该地点与情景组合尚无完整的已验证数据，不以邻近地点或缺测值代替。" + (coverage ? "当前可用：" + coverage : "") };
  }
  return { status: "available" as const, record, summary: summarizeHeat(record), provenance: snapshot.provenance };
}
