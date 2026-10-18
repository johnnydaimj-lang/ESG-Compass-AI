// 把可确认的具体文章链接替换掉品牌首页链接。

import { readPublishedContents, writePublishedContents } from "@/lib/publication-store";

const LINKS: Record<string, { sourceUrl: string; articleUrl: string }> = {
  "src-wef-cso-outlook-2026": {
    sourceUrl: "https://reports.weforum.org/chief-sustainability-officers-outlook/",
    articleUrl: "https://reports.weforum.org/chief-sustainability-officers-outlook/",
  },
  "src-petrochina-tarim-ethylene-2026": {
    sourceUrl: "https://so.html5.qq.com/page/real/search_news?docid=70000021_2566aa943f075552",
    articleUrl: "https://so.html5.qq.com/page/real/search_news?docid=70000021_2566aa943f075552",
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
process.stdout.write(`article urls fixed: ${updated}\n`);

export {};
