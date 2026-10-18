// 将新补录的重点事件挂到对应知识专区（幂等）。

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ASSIGNMENTS: Record<string, string[]> = {
  "esg-disclosure": ["src-wef-cso-outlook-2026"],
  "green-finance": [
    "src-gcf-kuwait-fund-mou-2026",
    "src-tpi-banking-transition-2026",
    "src-1f94eio",
  ],
  "labor-human-rights": ["src-norway-swf-ethics-2026"],
};

const path = resolve(process.cwd(), "data", "zones.json");
const data = JSON.parse(readFileSync(path, "utf8"));
const zones: Array<{ id: string; eventIds?: string[] }> = data.zones || data;

for (const zone of zones) {
  const additions = ASSIGNMENTS[zone.id];
  if (!additions) continue;
  const eventIds = Array.isArray(zone.eventIds) ? zone.eventIds : [];
  for (const id of additions) {
    if (!eventIds.includes(id)) eventIds.push(id);
  }
  zone.eventIds = eventIds;
}

writeFileSync(path, JSON.stringify({ zones }, null, 2) + "\n", "utf8");
process.stdout.write(`zones assigned: ${Object.values(ASSIGNMENTS).flat().length}\n`);

export {};
