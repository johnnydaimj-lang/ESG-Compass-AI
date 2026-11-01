// 输出待配置与停用信源清单，按原因分类，便于逐项打通。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface HealthSource {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  health: string;
  reason: string;
}

interface SourceEntry {
  id: string;
  name: string;
  type: string;
  url: string;
  notes?: string;
}

const healthPath = resolve(process.cwd(), "data", "source-health.json");
const sourcesPath = resolve(process.cwd(), "data", "sources.json");
const reportPath = resolve(process.cwd(), "data", "source-gaps.md");

if (!existsSync(healthPath)) {
  process.stderr.write("缺少 data/source-health.json，请先运行 npm run source:health\n");
  process.exit(1);
}

const health = JSON.parse(readFileSync(healthPath, "utf8")) as {
  generatedAt: string;
  summary: Record<string, number>;
  sources: HealthSource[];
};
const sourceFile = JSON.parse(readFileSync(sourcesPath, "utf8")) as { sources?: SourceEntry[] };
const sourceMap = new Map((sourceFile.sources || []).map((source) => [source.id, source]));

const skipped = health.sources.filter((source) => source.health === "skipped");
const disabled = health.sources.filter((source) => source.health === "disabled");

function category(reason: string): string {
  if (reason.includes("缺少环境变量")) return "缺少环境变量";
  if (reason.includes("适配器")) return "适配器未实现";
  return "其他待配置";
}

const skippedGroups = new Map<string, HealthSource[]>();
for (const source of skipped) {
  const key = category(source.reason);
  if (!skippedGroups.has(key)) skippedGroups.set(key, []);
  skippedGroups.get(key)!.push(source);
}

const lines: string[] = [];
lines.push(`# ESG Compass 信源缺口报告`);
lines.push("");
lines.push(`生成时间：${health.generatedAt}`);
lines.push("");
lines.push(`- 总信源：${health.summary.total}`);
lines.push(`- 启用：${health.summary.enabled}`);
lines.push(`- 正常：${health.summary.healthy}`);
lines.push(`- 无更新：${health.summary.idle}`);
lines.push(`- 异常：${health.summary.degraded}`);
lines.push(`- 待配置：${health.summary.skipped}`);
lines.push(`- 停用：${health.summary.disabled}`);
lines.push("");

lines.push(`## 一、待配置信源（${skipped.length}）`);
for (const [group, items] of skippedGroups) {
  lines.push("");
  lines.push(`### ${group}（${items.length}）`);
  for (const item of items) {
    lines.push(`- ${item.name}（${item.id}，${item.type}）：${item.reason}`);
  }
}

lines.push("");
lines.push(`## 二、停用信源（${disabled.length}）`);
for (const item of disabled) {
  const source = sourceMap.get(item.id);
  const note = source?.notes ? `，${source.notes}` : "";
  lines.push(`- ${item.name}（${item.id}，${item.type}）：${source?.url || ""}${note}`);
}

const text = lines.join("\n") + "\n";
writeFileSync(reportPath, text, "utf8");
process.stdout.write(text);

export {};
