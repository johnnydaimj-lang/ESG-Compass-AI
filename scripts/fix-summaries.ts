// 一次性修复：把结尾被截断的英文摘要收束到完整句子，并清空对应中文摘要以便重新翻译。

import { cleanSummaryText } from "@/lib/pipeline/text";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

function main() {
  const contents = readPublishedContents();
  let fixed = 0;
  for (const item of contents) {
    const raw = String(item.summary || "").trim();
    const cleaned = cleanSummaryText(raw);
    if (cleaned !== raw) {
      item.summary = cleaned;
      item.summaryZh = "";
      fixed += 1;
    }
  }
  writePublishedContents(contents);
  process.stdout.write(`summaries fixed: fixed=${fixed} items=${contents.length}\n`);
}

main();
