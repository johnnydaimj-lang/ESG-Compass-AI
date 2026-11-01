// 根据用户提供的 2026 年 10 月国际 ESG 新闻，补充候选信源（默认停用，待适配器验证后启用）。

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "data", "sources.json");

const CANDIDATES = [
  {
    id: "un-news",
    name: "联合国新闻",
    url: "https://news.un.org/en/",
    type: "webpage",
    contentType: "政策",
    region: "全球",
    language: "en",
    notes: "联合国官方新闻；建议实现 webpage/rss 适配器后启用。",
  },
  {
    id: "wmo-news",
    name: "世界气象组织（WMO）新闻",
    url: "https://wmo.int/news/",
    type: "webpage",
    contentType: "政策",
    region: "全球",
    language: "en",
    notes: "WMO 官方新闻与温室气体公报；建议实现 webpage 适配器后启用。",
  },
  {
    id: "gcf-news",
    name: "绿色气候基金（GCF）新闻",
    url: "https://www.greenclimate.fund/news",
    type: "webpage",
    contentType: "行业",
    region: "全球",
    language: "en",
    notes: "GCF 官方新闻与董事会项目；建议实现 webpage 适配器后启用。",
  },
  {
    id: "aiib-news",
    name: "亚洲基础设施投资银行（AIIB）新闻",
    url: "https://www.aiib.org/en/news-events/news/",
    type: "webpage",
    contentType: "行业",
    region: "全球",
    language: "en",
    notes: "AIIB 官方新闻与项目；建议实现 webpage 适配器后启用。",
  },
  {
    id: "cbd-news",
    name: "联合国生物多样性公约（CBD）新闻",
    url: "https://www.cbd.int/",
    type: "webpage",
    contentType: "政策",
    region: "全球",
    language: "en",
    notes: "CBD/COP 官方新闻与会议成果；建议实现 webpage 适配器后启用。",
  },
  {
    id: "carbon-brief",
    name: "Carbon Brief",
    url: "https://www.carbonbrief.org/feed/",
    type: "rss",
    contentType: "观点",
    region: "全球",
    language: "en",
    notes: "气候政策与能源分析；RSS 待验证后启用。",
  },
  {
    id: "state-grid-news",
    name: "国家电网新闻",
    url: "http://www.sgcc.com.cn/",
    type: "webpage",
    contentType: "行业",
    region: "中国",
    language: "zh",
    notes: "国家电网官方新闻与投资数据；建议实现 webpage 适配器后启用。",
  },
  {
    id: "finance-biodiversity",
    name: "Finance for Biodiversity Foundation",
    url: "https://www.financeforbiodiversity.org/",
    type: "webpage",
    contentType: "政策",
    region: "全球",
    language: "en",
    notes: "自然相关金融披露与金融机构倡议；建议实现 webpage 适配器后启用。",
  },
  {
    id: "citi-news",
    name: "花旗集团新闻",
    url: "https://www.citigroup.com/global/news/",
    type: "webpage",
    contentType: "行业",
    region: "全球",
    language: "en",
    notes: "花旗官方新闻与可持续金融产品；建议实现 webpage 适配器后启用。",
  },
  {
    id: "google-blog",
    name: "Google 官方博客",
    url: "https://blog.google/rss/",
    type: "rss",
    contentType: "行业",
    region: "全球",
    language: "en",
    notes: "Google 清洁能源、数据中心与虚拟电厂动态；RSS 待验证后启用。",
  },
  {
    id: "terradot-news",
    name: "Terradot 新闻",
    url: "https://www.terradot.com/",
    type: "webpage",
    contentType: "行业",
    region: "全球",
    language: "en",
    notes: "增强岩石风化碳移除项目动态；建议实现 webpage 适配器后启用。",
  },
  {
    id: "finnish-police",
    name: "芬兰警方新闻",
    url: "https://poliisi.fi/en/",
    type: "webpage",
    contentType: "行业",
    region: "芬兰",
    language: "en",
    notes: "芬兰警方环境违法调查通报；建议实现 webpage 适配器后启用。",
  },
];

const data = JSON.parse(readFileSync(PATH, "utf8")) as { sources?: Array<Record<string, unknown>> };
const sources = data.sources || [];
let added = 0;
for (const candidate of CANDIDATES) {
  const existing = sources.find((source) => source.id === candidate.id);
  const entry = {
    ...candidate,
    enabled: false,
    fallbacks: [],
  };
  if (existing) Object.assign(existing, entry);
  else {
    sources.push(entry);
    added += 1;
  }
}
data.sources = sources;
writeFileSync(PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
process.stdout.write(`candidate sources added=${added} total=${sources.length}\n`);

export {};
