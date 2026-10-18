// 将可核实来源的原文链接替换为更精确的官方页面。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const LINKS: Record<string, { sourceUrl: string; articleUrl: string }> = {
  "src-norway-swf-ethics-2026": {
    sourceUrl: "https://www.nbim.no/en/news-and-insights/the-press/",
    articleUrl: "https://www.nbim.no/en/news-and-insights/the-press/",
  },
  "src-eu-summit-energy-carbon-2026": {
    sourceUrl: "https://www.consilium.europa.eu/en/meetings/european-council/2026/10/15-16/",
    articleUrl: "https://www.consilium.europa.eu/en/meetings/european-council/2026/10/15-16/",
  },
  "src-un-global-biodiversity-action-report-2026": {
    sourceUrl: "https://www.cbd.int/gbo",
    articleUrl: "https://www.cbd.int/gbo",
  },
};

const contents = readPublishedContents();
let updated = 0;
for (const item of contents) {
  const link = LINKS[item.id];
  if (!link) continue;
  item.sourceUrl = link.sourceUrl;
  item.articleUrl = link.articleUrl;
  updated += 1;
}
writePublishedContents(contents);
process.stdout.write(`source links refined: ${updated}\n`);

export {};
