// 将财政部 9 项行业可持续披露应用指南（征求意见）作为一条政策内容补进发布快照。

import type { ContentItem } from "@/lib/contracts/content";
import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const URL = "http://kjs.mof.gov.cn/gongzuotongzhi/202609/t20260929_3998329.htm";

const item: ContentItem = {
  id: "src-mof-climate-disclosure-appguide-2026",
  title: "关于征求《〈企业可持续披露准则第1号——气候（试行）〉应用指南（征求意见稿）》及电力等9项行业应用指南（征求意见稿）意见的函",
  titleZh: "财政部就气候准则应用指南及电力等9项行业应用指南征求意见",
  summary:
    "财政部办公厅2026年9月30日发文（财办会〔2026〕34号），就《企业可持续披露准则第1号——气候（试行）》应用指南（征求意见稿）以及电力、钢铁、煤炭、石油、化肥、铝、氢、水泥、汽车9项行业应用指南（征求意见稿）公开征求意见，反馈截止2026年10月26日。",
  summaryZh:
    "财政部办公厅2026年9月30日发文（财办会〔2026〕34号），就《企业可持续披露准则第1号——气候（试行）》应用指南（征求意见稿）以及电力、钢铁、煤炭、石油、化肥、铝、氢、水泥、汽车9项行业应用指南（征求意见稿）公开征求意见，反馈截止2026年10月26日。",
  contentType: "政策",
  region: "中国",
  publishedAt: "2026-09-30T02:00:00.000Z",
  importanceLevel: "高",
  sourceName: "财政部",
  sourceUrl: URL,
  articleUrl: URL,
  esgTopic: "合规与监管",
  recommended: true,
  recommendReason:
    "财政部首次就气候准则配套应用指南及9个重点行业应用指南公开征求意见，覆盖电力、钢铁、煤炭、石油、化肥、铝、氢、水泥、汽车，是可持续披露准则体系落地的关键一步。",
  pipeline: {
    score: 88,
    scoreThreshold: 60,
    scorePass: true,
    sourceTier: "T1",
    storyId: "story-mof-climate-appguide-2026",
    heat: 0,
    tags: ["政策", "合规与监管", "中国"],
    fact: {
      title: "财政部就气候准则应用指南及9项行业应用指南征求意见",
      subject: "财政部办公厅",
      action: "公开征求意见",
      object: "气候准则应用指南及电力等9项行业应用指南",
      occurredAt: "2026-09-30",
    },
    pipelineVersion: "esg-v2.0.0",
  },
};

const contents = readPublishedContents();
const existing = contents.findIndex((c) => c.id === item.id);
if (existing >= 0) {
  contents[existing] = item;
  console.log("updated", item.id);
} else {
  contents.push(item);
  console.log("added", item.id);
}
contents.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
writePublishedContents(contents);
process.stdout.write(`mof item in place; total=${contents.length}\n`);
