// 给「SEC 结束 CA100+ 调查」这条事件挂上 SEC 官方调查报告作为一手来源。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const ITEM_ID = "src-zibkgm";
const SEC_URL = "https://www.sec.gov/files/litigation/investreport/34-106611.pdf";

const contents = readPublishedContents();
const item = contents.find((c) => c.id === ITEM_ID);
if (!item) {
  console.log("item not found:", ITEM_ID);
  process.exitCode = 1;
} else {
  const refs = item.sourceRefs || [];
  if (!refs.some((r) => r.sourceUrl === SEC_URL)) {
    refs.push({
      sourceName: "美国证券交易委员会（SEC）",
      sourceUrl: SEC_URL,
      title: "Report of Investigation Pursuant to Section 21(a) — Release No. 34-106611",
      publishedAt: "2026-10-07",
    });
    item.sourceRefs = refs;
  }
  if (!item.summaryZh || !item.summaryZh.includes("SEC 官方调查报告")) {
    item.summaryZh = `${item.summaryZh || ""} SEC 同时发布调查报告（Release No. 34-106611），说明不采取执法行动的理由，并提示在气候相关组织中的参与和投票可能触发披露与代理规则义务。`.trim();
  }
  writePublishedContents(contents);
  process.stdout.write(`sec ref attached to ${ITEM_ID}; refs=${item.sourceRefs?.length}\n`);
}

export {};
