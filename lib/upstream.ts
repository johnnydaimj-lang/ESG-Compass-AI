import { load } from "cheerio";
import type { SourceRef } from "@/lib/contracts/content";

const SOCIAL_DOMAINS = [
  "twitter.com",
  "x.com",
  "facebook.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "weibo.com",
  "threads.net",
];

// 综合门户/财经媒体属于二手来源，不作为“官方原文”返回。
const SECONDHAND_DOMAINS = [
  "reuters.com",
  "bloomberg.com",
  "ft.com",
  "wsj.com",
  "cnbc.com",
  "forbes.com",
  "businessinsider.com",
  "nytimes.com",
  "theguardian.com",
  "washingtonpost.com",
  "apnews.com",
  "axios.com",
  "politico.com",
  "yahoo.com",
  "msn.com",
  "新浪.com",
  "sina.com.cn",
  "163.com",
  "sohu.com",
  "qq.com",
  "toutiao.com",
  "ifeng.com",
];

const OFFICIAL_HOSTS: Record<string, string> = {
  "finance.ec.europa.eu": "欧盟委员会",
  "ec.europa.eu": "欧盟委员会",
  "europa.eu": "欧盟",
  "un.org": "联合国",
  "unep.org": "联合国环境规划署",
  "unfccc.int": "UNFCCC",
  "sec.gov": "美国 SEC",
  "worldbank.org": "世界银行",
  "ifrs.org": "IFRS 基金会",
  "tnfd.global": "TNFD",
  "eurosif.org": "Eurosif",
};

function hostOf(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchesDomain(host: string, domains: string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isAsset(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|css|js|pdf|zip|mp4|mp3)(\?|#|$)/i.test(url);
}

function labelForHost(host: string): string {
  for (const [domain, label] of Object.entries(OFFICIAL_HOSTS)) {
    if (host === domain || host.endsWith(`.${domain}`)) return label;
  }
  return host.replace(/^www\./, "");
}

export interface UpstreamExtractionOptions {
  max?: number;
  allowSecondhand?: boolean;
}

// 从 RSS 正文或文章 HTML 中提取非本站、非社交、非资产链接，作为上游原文候选。
export function extractUpstreamLinks(
  html: string,
  articleUrl: string,
  options: UpstreamExtractionOptions = {}
): SourceRef[] {
  const max = options.max ?? 3;
  const sourceHost = hostOf(articleUrl);
  const $ = load(html || "");
  const seen = new Set<string>();
  const refs: SourceRef[] = [];

  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    let absolute: string;
    try {
      absolute = new URL(href, articleUrl).toString();
    } catch {
      return;
    }
    if (!/^https?:/i.test(absolute)) return;
    const host = hostOf(absolute);
    if (!host) return;
    if (host === sourceHost || host.endsWith(`.${sourceHost}`)) return;
    if (matchesDomain(host, SOCIAL_DOMAINS)) return;
    if (!options.allowSecondhand && matchesDomain(host, SECONDHAND_DOMAINS)) return;
    if (isAsset(absolute)) return;
    const key = absolute.split("#")[0];
    if (seen.has(key)) return;
    seen.add(key);
    const text = $(element).text().trim().replace(/\s+/g, " ");
    // 锚文本经常是 “the PSF’s” 这类代词，信息量不足时不写入 title。
    const meaningfulTitle =
      text.length >= 8 && !/['’]s$/i.test(text) && !/^(here|link|source|read more)$/i.test(text);
    refs.push({
      sourceName: labelForHost(host),
      sourceUrl: key,
      title: meaningfulTitle ? text.slice(0, 120) : undefined,
    });
    if (refs.length >= max) return false;
  });

  return refs;
}

