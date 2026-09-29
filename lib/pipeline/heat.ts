import type { HeatEvidence, HeatResult } from "@/lib/contracts/pipeline";
import {
  HOT_HALF_LIFE_HOURS,
  HOT_MIN_EDITORIAL_SOURCES,
  HOT_MIN_PARTICIPANTS,
  HOT_WINDOW_HOURS,
  SOURCE_TIER_WEIGHTS,
} from "./config";

const HOUR_MS = 3_600_000;

function decay(ageHours: number): number {
  return 0.5 ** (Math.max(0, ageHours) / HOT_HALF_LIFE_HOURS);
}

function heatAt(entries: HeatEvidence[], at: number): number {
  let score = 0;
  for (const entry of entries) {
    const ageHours = (at - Date.parse(entry.publishedAt)) / HOUR_MS;
    if (!Number.isFinite(ageHours) || ageHours < 0 || ageHours > HOT_WINDOW_HOURS) continue;
    score += SOURCE_TIER_WEIGHTS[entry.sourceTier] * decay(ageHours);
  }
  return Math.round(score * 10) / 10;
}

export function calculateHeat(evidence: HeatEvidence[], now = new Date()): HeatResult {
  const at = now.getTime();
  const bySource = new Map<string, HeatEvidence>();
  for (const entry of evidence) {
    const ageHours = (at - Date.parse(entry.publishedAt)) / HOUR_MS;
    if (!Number.isFinite(ageHours) || ageHours < 0 || ageHours > HOT_WINDOW_HOURS) continue;
    const current = bySource.get(entry.sourceId);
    if (!current || Date.parse(entry.publishedAt) > Date.parse(current.publishedAt)) {
      bySource.set(entry.sourceId, entry);
    }
  }

  const entries = [...bySource.values()];
  const participants = entries.length;
  const editorialParticipants = entries.filter((entry) => entry.editorialSource).length;
  const signalParticipants = participants - editorialParticipants;
  const firstPublishedAt = entries.length
    ? entries.map((entry) => entry.publishedAt).sort()[0]
    : null;
  const recent6h = entries.filter((entry) => at - Date.parse(entry.publishedAt) <= 6 * HOUR_MS).length;

  if (participants < HOT_MIN_PARTICIPANTS || editorialParticipants < HOT_MIN_EDITORIAL_SOURCES) {
    return {
      score: 0,
      participants,
      editorialParticipants,
      signalParticipants,
      firstPublishedAt,
      recent6h,
      heat6hAgo: 0,
      trend: "unknown",
      trendPct: null,
      badges: [],
      reason: "未达到独立参与方或编辑信源门槛",
    };
  }

  const score = heatAt(entries, at);
  const heat6hAgo = heatAt(entries, at - 6 * HOUR_MS);
  const isNew = firstPublishedAt ? at - Date.parse(firstPublishedAt) < 6 * HOUR_MS : false;
  const surge = recent6h >= 3 && recent6h / participants >= 0.5;
  const trendPct = heat6hAgo > 0 ? (score - heat6hAgo) / heat6hAgo : null;
  const trend: HeatResult["trend"] = isNew
    ? "new"
    : trendPct === null
      ? "unknown"
      : trendPct > 0.1
        ? "up"
        : trendPct < -0.1
          ? "down"
          : "flat";
  const badges: HeatResult["badges"] = [];
  if (isNew) badges.push("new");
  if (surge) badges.push("surge");
  if (!isNew && trendPct !== null && trendPct > 0.15) badges.push("rising");

  return {
    score,
    participants,
    editorialParticipants,
    signalParticipants,
    firstPublishedAt,
    recent6h,
    heat6hAgo,
    trend,
    trendPct: trendPct === null ? null : Math.round(trendPct * 1000) / 10,
    badges,
    reason: "按独立信源、信源档位与 24 小时半衰期计算",
  };
}
