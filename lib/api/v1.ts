import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  CONTENT_TYPES,
  getAllContents,
  type ContentItem,
  type ContentType,
} from "@/lib/esg-data";
import { isFeedEligible } from "@/lib/feed-policy";
import { readDaily, readPipelineStatus } from "@/lib/publication-store";
import {
  contentTypeFromSlug,
  queryContents,
  sortContentsByPublishedAt,
  type ContentQuery,
} from "@/lib/publication-query";
import { getZonesByEventId, getZonesForContent } from "@/lib/zones-store";

const API_VERSION = "1.0";
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=600";

export interface ApiRouteOptions {
  requireAuth: boolean;
}

export interface ContentApiOptions {
  includeBody?: boolean;
}

function corsOrigin(): string {
  return (process.env.ESG_API_ALLOWED_ORIGIN || "*").trim() || "*";
}

export function apiHeaders(requireAuth: boolean): HeadersInit {
  return {
    "Access-Control-Allow-Origin": corsOrigin(),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
    "X-ESG-API-Version": API_VERSION,
    "Cache-Control": requireAuth ? "private, no-store" : PUBLIC_CACHE,
  };
}

export function apiOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: apiHeaders(false) });
}

function requestApiKey(request: Request): string {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || (request.headers.get("x-api-key") || "").trim();
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function apiAuthError(
  request: Request,
  requireAuth: boolean,
): NextResponse | null {
  if (!requireAuth) return null;
  const expected = process.env.ESG_API_KEY?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "api_key_not_configured", message: "ESG_API_KEY 未配置" },
      { status: 503, headers: apiHeaders(true) },
    );
  }
  const provided = requestApiKey(request);
  if (!provided || !constantTimeEqual(provided, expected)) {
    return NextResponse.json(
      { error: "unauthorized", message: "请使用 Bearer Token 或 X-API-Key 鉴权" },
      { status: 401, headers: apiHeaders(true) },
    );
  }
  return null;
}

export function apiJson(data: unknown, options: ApiRouteOptions, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...apiHeaders(options.requireAuth),
      ...(init?.headers || {}),
    },
  });
}

export function contentApiPayload(
  item: ContentItem,
  options: ContentApiOptions = {},
): Record<string, unknown> {
  const zones = new Map(
    [...getZonesByEventId(item.id), ...getZonesForContent(item)].map((zone) => [zone.id, zone]),
  );
  const payload: Record<string, unknown> = {
    id: item.id,
    title: item.title,
    titleZh: item.titleZh,
    displayTitle: item.titleZh || item.title,
    summary: item.summary,
    summaryZh: item.summaryZh,
    displaySummary: item.summaryZh || item.summary,
    contentType: item.contentType,
    region: item.region,
    esgTopic: item.esgTopic,
    importanceLevel: item.importanceLevel,
    publishedAt: item.publishedAt,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    articleUrl: item.articleUrl,
    link: item.articleUrl || item.sourceUrl,
    score: item.pipeline?.score,
    recommended: Boolean(item.recommended),
    reason: item.recommended ? (item.recommendReason || "") : undefined,
    tags: item.pipeline?.tags || [],
    sourceRefs: item.sourceRefs || [],
    zones: Array.from(zones.values()).map((zone) => ({
      id: zone.id,
      name: zone.name,
    })),
  };
  if (options.includeBody) {
    payload.body = item.body;
    payload.bodyZh = item.bodyZh;
  }
  return payload;
}

function publicContents(): ContentItem[] {
  return sortContentsByPublishedAt(getAllContents().filter((item) => isFeedEligible(item)));
}

function contentTypeParam(value: string | null): ContentType | undefined {
  if (!value) return undefined;
  if ((CONTENT_TYPES as readonly string[]).includes(value)) return value as ContentType;
  return contentTypeFromSlug(value);
}

export async function handleContentsRequest(
  request: Request,
  options: ApiRouteOptions,
): Promise<NextResponse> {
  const authError = apiAuthError(request, options.requireAuth);
  if (authError) return authError;

  const url = new URL(request.url);
  const rawPage = Number(url.searchParams.get("page") || "1");
  const rawPageSize = Number(url.searchParams.get("pageSize") || url.searchParams.get("limit") || "20");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 1
    ? Math.min(50, Math.floor(rawPageSize))
    : 20;
  const rawType = url.searchParams.get("contentType") || url.searchParams.get("type");
  const contentType = contentTypeParam(rawType);
  if (rawType && !contentType) {
    return apiJson(
      { error: "invalid_content_type", message: `contentType 必须是 ${CONTENT_TYPES.join(" / ")} 或对应英文 slug` },
      options,
      { status: 400 },
    );
  }

  const curated = url.searchParams.get("curated") || url.searchParams.get("recommended");
  const updatedAfter = url.searchParams.get("updatedAfter") || url.searchParams.get("since") || undefined;
  const query: ContentQuery = {
    q: (url.searchParams.get("q") || "").trim().slice(0, 120),
    contentType,
    recommended: curated === "true" ? true : curated === "false" ? false : undefined,
    updatedAfter,
    excludeDrafts: true,
  };

  let items = queryContents(publicContents(), query);
  const zoneId = url.searchParams.get("zone");
  if (zoneId) {
    items = items.filter((item) =>
      [...getZonesByEventId(item.id), ...getZonesForContent(item)].some((zone) => zone.id === zoneId),
    );
  }

  const total = items.length;
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const latestPublishedAt = items[0]?.publishedAt || null;
  return apiJson({
    ok: true,
    items: pageItems.map((item) => contentApiPayload(item)),
    pagination: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
      nextPage: page * pageSize < total ? page + 1 : null,
    },
    query: {
      q: query.q || null,
      contentType: contentType || null,
      curated: query.recommended ?? null,
      since: updatedAfter || null,
      zone: zoneId || null,
    },
    latestPublishedAt,
  }, options);
}

export async function handleContentDetail(
  request: Request,
  id: string,
  options: ApiRouteOptions,
): Promise<NextResponse> {
  const authError = apiAuthError(request, options.requireAuth);
  if (authError) return authError;
  const item = publicContents().find((candidate) => candidate.id === id);
  if (!item) {
    return apiJson({ error: "not_found", message: "未找到该内容" }, options, { status: 404 });
  }
  const includeBody = new URL(request.url).searchParams.get("includeBody") === "true";
  return apiJson({
    ok: true,
    item: contentApiPayload(item, { includeBody }),
  }, options);
}

export async function handleDaily(
  request: Request,
  options: ApiRouteOptions,
): Promise<NextResponse> {
  const authError = apiAuthError(request, options.requireAuth);
  if (authError) return authError;
  const daily = readDaily();
  if (!daily) {
    return apiJson({ error: "not_found", message: "暂无日报" }, options, { status: 404 });
  }
  return apiJson({ ok: true, daily }, options);
}

export async function handleStatus(
  request: Request,
  options: ApiRouteOptions,
): Promise<NextResponse> {
  const authError = apiAuthError(request, options.requireAuth);
  if (authError) return authError;
  const status = readPipelineStatus();
  const contents = publicContents();
  const latest = contents[0]?.publishedAt || null;
  return apiJson({
    ok: true,
    status: {
      version: status?.pipelineVersion || null,
      generatedAt: status?.finishedAt || null,
      latestPublishedAt: latest,
      totalPublished: getAllContents().length,
      totalVisible: contents.length,
      curated: contents.filter((item) => item.recommended).length,
      mode: status?.mode || null,
    },
  }, options);
}

export function handleZones(
  request: Request,
  options: ApiRouteOptions,
): NextResponse {
  const authError = apiAuthError(request, options.requireAuth);
  if (authError) return authError;
  const items = publicContents();
  const zones = new Map<string, { id: string; name: string; description: string; eventIds: string[]; keywords: string[]; count: number }>();
  for (const item of items) {
    const itemZones = new Map(
      [...getZonesByEventId(item.id), ...getZonesForContent(item)].map((zone) => [zone.id, zone]),
    );
    for (const zone of itemZones.values()) {
      const current = zones.get(zone.id) || {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        eventIds: zone.eventIds,
        keywords: zone.keywords || [],
        count: 0,
      };
      current.count += 1;
      zones.set(zone.id, current);
    }
  }
  return apiJson({
    ok: true,
    zones: Array.from(zones.values()).sort((a, b) => b.count - a.count),
  }, options);
}
