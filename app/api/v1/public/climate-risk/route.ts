import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiHeaders, apiOptions } from "@/lib/api/v1";
import { HEAT_SOURCE, selectHeat, type HeatSnapshot } from "@/lib/climate-heat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { ...apiHeaders(false), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };
  const query = new URL(request.url).searchParams;
  // Validate inputs before any filesystem access; only the local vetted snapshot is read.
  try {
    selectHeat({ schemaVersion: 1, provenance: HEAT_SOURCE, records: [] }, query);
  } catch {
    return Response.json({ ok: false, error: "请提供有效的lat、lon、SSP情景、window和variable=tasmax。" }, { status: 400, headers });
  }
  try {
    const snapshot = JSON.parse(await readFile(path.join(process.cwd(), "data", "climate", "heat-snapshot.json"), "utf8")) as HeatSnapshot;
    return Response.json({ ok: true, ...selectHeat(snapshot, query) }, { headers });
  } catch {
    return Response.json({ ok: false, status: "unavailable", message: "高温数据快照暂不可用，请稍后重试。未生成替代数值。" }, { status: 503, headers: { ...headers, "Cache-Control": "no-store" } });
  }
}
export function OPTIONS() { return apiOptions(); }
