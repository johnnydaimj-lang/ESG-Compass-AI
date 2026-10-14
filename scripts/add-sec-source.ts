// 向 sources.json 增加 SEC 调查报告信源（幂等）。

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "data", "sources.json");
const data = JSON.parse(readFileSync(path, "utf8"));
const sources: Array<Record<string, unknown>> = data.sources || [];

const existing = sources.find((s) => s.id === "sec-investreports");
const entry = {
  id: "sec-investreports",
  name: "SEC 调查报告（Investigation Reports）",
  url: "https://www.sec.gov/enforcement-litigation/reports-investigations",
  type: "sec-investreport",
  contentType: "政策",
  region: "美国",
  language: "en",
  enabled: true,
  notes: "SEC 依据证券交易法第 21(a) 条发布的调查报告，含气候行动 100+/埃克森美孚等案例。",
};

if (existing) {
  Object.assign(existing, entry);
  console.log("updated sec-investreports");
} else {
  sources.push(entry);
  console.log("added sec-investreports");
}
writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
process.stdout.write(`sources total=${sources.length}\n`);
