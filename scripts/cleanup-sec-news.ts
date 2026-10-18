// 清理 SEC 新闻稿中不符合「ESG 相关 + 时效」的条目。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ESG_TERMS = ["climate", "esg", "sustainab", "environment", "greenwash", "greenwashing", "carbon", "emission", "greenhouse", "climate action", "net zero", "气候", "可持续", "排放", "环境"];
const RECENCY_DAYS = 60;

const contents = readPublishedContents();
const cutoff = Date.now() - RECENCY_DAYS * 24 * 3_600_000;
const filtered = contents.filter((item) => {
  if (item.sourceName !== "SEC 新闻稿（ESG 相关）") return true;
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const isEsg = ESG_TERMS.some((term) => text.includes(term.toLowerCase()));
  const parsed = Date.parse(item.publishedAt);
  const isRecent = Number.isFinite(parsed) && parsed >= cutoff;
  return isEsg && isRecent;
});
const removed = contents.length - filtered.length;
writePublishedContents(filtered);
process.stdout.write(`removed ${removed} non-ESG/outdated SEC news; remaining=${filtered.length}\n`);
