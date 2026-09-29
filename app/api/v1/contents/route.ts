import { NextResponse } from "next/server";
import { getAllContents, CONTENT_TYPES } from "@/lib/esg-data";
import { sliceLongText, CONTENT_API_TOKEN_BUDGET, CONTENT_API_SLICE_CHARS } from "@/lib/context-slicer";
import { getZonesByEventId, getZonesForContent } from "@/lib/zones-store";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const key = process.env.ESG_API_KEY;
  if (!key) return false;
  return request.headers.get("authorization") === `Bearer ${key}`;
}

function zonesForItem(item: { id: string; title?: string; summary?: string; esgTopic?: string }) {
  const map = new Map(
    [...getZonesByEventId(item.id), ...getZonesForContent(item)].map((z) => [z.id, z])
  );
  return Array.from(map.values()).map((z) => ({ id: z.id, name: z.name }));
}

export async function GET(request: Request) {
  if (!process.env.ESG_API_KEY) {
    return NextResponse.json({ error: "ESG_API_KEY 未配置" }, { status: 503 });
  }
  if (!authorize(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawPage = Number(url.searchParams.get("page") || "1");
  const rawPageSize = Number(url.searchParams.get("pageSize") || "20");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 1 ? Math.min(50, Math.floor(rawPageSize)) : 20;
  const contentType = url.searchParams.get("contentType");
  const curated = url.searchParams.get("curated");
  const updatedAfter = url.searchParams.get("updatedAfter");
  const zoneId = url.searchParams.get("zone");

  if (contentType && !(CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json({ error: `contentType 必须是 ${CONTENT_TYPES.join(" / ")}` }, { status: 400 });
  }

  let items = getAllContents().filter((c) => !c.aiDraft);
  if (contentType) items = items.filter((c) => c.contentType === contentType);
  if (curated === "true") items = items.filter((c) => c.recommended);
  if (curated === "false") items = items.filter((c) => !c.recommended);
  if (updatedAfter) items = items.filter((c) => c.publishedAt >= updatedAfter);
  if (zoneId) items = items.filter((c) => zonesForItem(c).some((z) => z.id === zoneId));

  const total = items.length;
  const sorted = items.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const payload = pageItems.map((c) => ({
    id: c.id,
    title: c.title,
    titleZh: c.titleZh,
    contentType: c.contentType,
    region: c.region,
    publishedAt: c.publishedAt,
    importanceLevel: c.importanceLevel,
    summary: sliceLongText(c.summary, CONTENT_API_SLICE_CHARS),
    summaryZh: c.summaryZh ? sliceLongText(c.summaryZh, CONTENT_API_SLICE_CHARS) : undefined,
    summaryTruncated: c.summary.length > CONTENT_API_SLICE_CHARS,
    sourceName: c.sourceName,
    sourceUrl: c.sourceUrl,
    esgTopic: c.esgTopic,
    recommended: Boolean(c.recommended),
    link: c.articleUrl ?? c.sourceUrl,
    sourceRefs: c.sourceRefs,
    zones: zonesForItem(c),
  }));

  return NextResponse.json({
    items: payload,
    total,
    page,
    pageSize,
    tokenBudget: CONTENT_API_TOKEN_BUDGET,
    sliceChars: CONTENT_API_SLICE_CHARS,
  });
}
