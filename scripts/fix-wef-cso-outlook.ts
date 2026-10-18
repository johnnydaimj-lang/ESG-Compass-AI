// 修正 WEF《首席可持续发展官展望》：英文首发日期 2026-09-15，中文解读作为关联报道。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ID = "src-wef-cso-outlook-2026";
const ENGLISH_URL = "https://www.weforum.org/publications/chief-sustainability-officers-outlook/";
const CHINESE_URL = "https://cn.weforum.org/";

const contents = readPublishedContents();
const item = contents.find((entry) => entry.id === ID);
if (!item) {
  process.stderr.write(`item not found: ${ID}\n`);
  process.exitCode = 1;
} else {
  item.title = "Chief Sustainability Officers' Outlook";
  item.summary =
    "The World Economic Forum published the first edition of its Chief Sustainability Officers' Outlook on 15 September 2026 in Geneva, examining the evolving role, priorities and capabilities of corporate sustainability leaders.";
  item.summaryZh =
    "世界经济论坛于2026年9月15日在日内瓦发布首份《首席可持续发展官展望》（Chief Sustainability Officers' Outlook），聚焦首席可持续发展官在企业战略中的角色、优先议题与能力需求，为观察全球企业可持续发展治理趋势提供参考。";
  item.bodyZh =
    "世界经济论坛于2026年9月15日在日内瓦发布首份《首席可持续发展官展望》（Chief Sustainability Officers' Outlook）。报告基于对全球首席可持续发展官的调研，梳理企业在气候与可持续发展议题上的优先事项、组织定位、跨部门协作与能力建设方向，并讨论首席可持续发展官如何在战略制定、信息披露与业务转型中发挥作用。2026年10月8日，世界经济论坛中文官网发布中文解读，对报告要点进行了本地化梳理。";
  item.publishedAt = "2026-09-15T08:00:00.000Z";
  item.sourceUrl = ENGLISH_URL;
  item.articleUrl = ENGLISH_URL;
  item.sourceRefs = [
    {
      sourceName: "世界经济论坛中文官网",
      sourceUrl: CHINESE_URL,
      title: "《首席可持续发展官展望》中文解读",
      publishedAt: "2026-10-08",
    },
  ];
  if (item.pipeline) {
    item.pipeline.fact = {
      ...(item.pipeline.fact || { title: item.title, subject: "世界经济论坛", action: "发布", object: item.title }),
      occurredAt: "2026-09-15",
    };
  }
  writePublishedContents(contents);
  process.stdout.write(`updated ${ID}: publishedAt=${item.publishedAt}, sourceRefs=${item.sourceRefs.length}\n`);
}

export {};
