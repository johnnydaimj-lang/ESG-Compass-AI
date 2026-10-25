// 收束过长的学术摘要，避免首页截断落在括号或词语中间。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ID = "src-ssrn-esg-esg-rating-disagreement-as-a-greenwashing-signal-3219";
const SUMMARY_ZH =
  "本研究基于中国 A 股 8111 家公司年度观察（2012—2022 年），考察 ESG 评级分歧能否预测企业洗绿，以及数字化转型如何通过披露与绩效渠道调节这一关系。研究发现，总体评级分歧是洗绿的有力预测因素，数字化对披露渠道与绩效渠道的影响呈现不对称性。";

const contents = readPublishedContents();
const item = contents.find((entry) => entry.id === ID);
if (!item) {
  process.stderr.write(`item not found: ${ID}\n`);
  process.exitCode = 1;
} else {
  item.summaryZh = SUMMARY_ZH;
  writePublishedContents(contents);
  process.stdout.write(`updated ${ID}: summaryZh=${SUMMARY_ZH.length}\n`);
}

export {};
