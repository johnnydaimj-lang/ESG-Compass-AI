// 用新的统一精选门槛重打现有内容的 recommended 标记（复用已存的综合评分，无需重跑 LLM）。

import { CURATION_FLOOR } from "@/lib/pipeline/config";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const contents = readPublishedContents();
let changed = 0;
for (const item of contents) {
  const score = item.pipeline?.score ?? 0;
  const selected = score > CURATION_FLOOR;
  if (item.recommended !== selected) changed += 1;
  item.recommended = selected;
  if (item.pipeline) {
    item.pipeline.scorePass = selected;
    item.pipeline.scoreThreshold = CURATION_FLOOR;
  }
}
writePublishedContents(contents);
process.stdout.write(
  `curation reapplied: changed=${changed}, recommended=${contents.filter((c) => c.recommended).length}, total=${contents.length}\n`,
);
