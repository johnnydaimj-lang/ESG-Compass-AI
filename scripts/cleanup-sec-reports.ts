// 清理已入库的非 ESG 或过旧的 SEC 调查报告，只保留 ESG 相关且近期的报告。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ESG_TERMS = ["climate", "esg", "sustainab", "environment", "disclosure", "carbon", "emission", "greenhouse", "气候", "可持续", "披露", "排放", "环境"];

const contents = readPublishedContents();
const cutoff = Date.now() - 12 * 30 * 24 * 3_600_000;
const filtered = contents.filter((item) => {
  if (!item.sourceName.includes("调查报告")) return true;
  const title = (item.title || "").toLowerCase();
  const isEsg = ESG_TERMS.some((term) => title.includes(term));
  const parsed = Date.parse(item.publishedAt);
  const isRecent = !Number.isNaN(parsed) && parsed >= cutoff;
  return isEsg && isRecent;
});
const removed = contents.length - filtered.length;
writePublishedContents(filtered);
process.stdout.write(`removed ${removed} old/non-ESG SEC reports; remaining=${filtered.length}\n`);
