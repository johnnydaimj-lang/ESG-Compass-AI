import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_ZONES, DEFAULT_ZONE_KEYWORDS, type Zone } from "@/lib/zones-data";

const ZONES_FILE = resolve(process.cwd(), "data", "zones.json");

let zoneCache: { mtimeMs: number; size: number; zones: Zone[] } | null = null;

export function readZones(): Zone[] {
  try {
    const stat = statSync(ZONES_FILE);
    if (zoneCache && zoneCache.mtimeMs === stat.mtimeMs && zoneCache.size === stat.size) {
      return zoneCache.zones;
    }
    const raw = JSON.parse(readFileSync(ZONES_FILE, "utf-8"));
    const zones = Array.isArray(raw) ? raw : raw.zones;
    const resolved = Array.isArray(zones) ? zones : DEFAULT_ZONES;
    zoneCache = { mtimeMs: stat.mtimeMs, size: stat.size, zones: resolved };
    return resolved;
  } catch {
    return DEFAULT_ZONES;
  }
}

export function writeZones(zones: Zone[]) {
  writeFileSync(ZONES_FILE, JSON.stringify({ zones }, null, 2) + "\n", "utf-8");
  try {
    const stat = statSync(ZONES_FILE);
    zoneCache = { mtimeMs: stat.mtimeMs, size: stat.size, zones };
  } catch {
    zoneCache = null;
  }
}

export function getAllZones(): Zone[] {
  return readZones();
}

export function getZoneById(id: string): Zone | undefined {
  return readZones().find((z) => z.id === id);
}

export function getZoneKeywords(zoneId: string): string[] {
  const zone = getZoneById(zoneId);
  return zone?.keywords || DEFAULT_ZONE_KEYWORDS[zoneId] || [];
}

export function getZonesForContent(content: { title?: string; summary?: string; titleZh?: string; summaryZh?: string; esgTopic?: string }): Zone[] {
  const text = `${content.title || ""} ${content.titleZh || ""} ${content.summary || ""} ${content.summaryZh || ""} ${content.esgTopic || ""}`.toLowerCase();
  return readZones().filter((z) => (z.keywords || DEFAULT_ZONE_KEYWORDS[z.id] || []).some((k) => text.includes(k.toLowerCase())));
}

export function getZonesByEventId(eventId: string): Zone[] {
  return readZones().filter((z) => z.eventIds.includes(eventId));
}
