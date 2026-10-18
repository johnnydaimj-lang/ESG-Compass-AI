// 给 SEC 新闻稿信源加 ESG 关键词过滤与时效窗口。

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "data", "sources.json");
const data = JSON.parse(readFileSync(path, "utf8"));
const source = data.sources.find((s: { id: string }) => s.id === "sec-esg");
if (!source) {
  console.log("sec-esg not found");
  process.exitCode = 1;
} else {
  source.keywords = [
    "climate",
    "esg",
    "sustainab",
    "environment",
    "greenwash",
    "greenwashing",
    "carbon",
    "emission",
    "greenhouse",
    "climate action",
    "net zero",
    "气候",
    "可持续",
    "排放",
    "环境",
  ];
  source.recencyDays = 60;
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("updated sec-esg: keywords + recencyDays=60");
}

export {};
