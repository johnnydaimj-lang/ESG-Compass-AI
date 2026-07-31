// ESG Compass — 现有内容质量清洗工具
// 与管道同一套规则：垃圾过滤、ESG 相关性、启发式精选回填。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isJunkItem, isEsgRelevant, isRatingRelevant, heuristicCurate } from "./esg-quality.mjs";

const target = resolve(process.cwd(), "data", "contents.json");
if (!existsSync(target)) {
  console.error("未找到 data/contents.json");
  process.exit(1);
}

const items = JSON.parse(readFileSync(target, "utf-8"));
const kept = [];
const removed = [];

for (const item of items) {
  const text = `${item.title || ""} ${item.summary || ""}`;
  if (isJunkItem(item) || !isEsgRelevant(text)) {
    removed.push(item);
    continue;
  }
  if (item.contentType === "评级动态" && !isRatingRelevant(item)) {
    removed.push(item);
    continue;
  }
  const curated = heuristicCurate(item, item.importanceLevel || "中");
  const next = { ...item, recommended: curated.recommended, whyMatters: curated.whyMatters };
  if (!next.whyMatters) delete next.whyMatters;
  kept.push(next);
}

writeFileSync(target, JSON.stringify(kept, null, 2), "utf-8");
console.log(`✅ 质量清洗完成：保留 ${kept.length} 条，移除 ${removed.length} 条`);
console.log(`   精选 ${kept.filter((k) => k.recommended).length} 条`);
if (removed.length > 0) {
  console.log("移除样例：");
  removed.slice(0, 10).forEach((r) => console.log(`  - ${r.sourceName} | ${r.title}`));
}
