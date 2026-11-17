import type { ContentItem, ContentType } from "@/lib/contracts/content";

const ACADEMIC_TERMS = ["journal", "paper", "abstract", "preprint", "doi", "论文", "期刊", "学术", "crossref", "ssrn", "研究"];
const RATING_TERMS = ["评级", "rating", "msci", "sustainalytics", "ecovadis", "moody's", "fitch", "方法论", "methodology", "score"];
const POLICY_TERMS = ["法规", "条例", "指令", "标准", "指南", "指引", "框架", "准则", "规则", "法案", "提案", "披露要求", "regulation", "directive", "standard", "guidance", "framework", "legislation", "proposal", "rule", "投票", "监管", "执法"];
const CORPORATE_ENFORCEMENT_TERMS = [
  "罚款", "处罚", "起诉", "诉讼", "停工", "整改", "违法", "违规", "环境犯罪", "接受调查", "遭调查",
  "fined", "penalty", "penalties", "prosecuted", "prosecution", "charged", "lawsuit", "sued", "cited", "violations", "shutdown order",
];
const CORPORATE_SUBJECT_TERMS = [
  "公司", "集团", "企业", "工厂", "矿场", "银行", "制造商", "零售商", "承包商", "运营商",
  "company", "companies", "corp", "corporation", "group", "bank", "manufacturer", "retailer", "contractor", "operator", "facility", "plant",
];
const INDUSTRY_TERMS = [
  "融资", "投资", "收购", "并购", "合作", "签署", "启动", "推出", "投产", "建设", "发行", "债券", "基金", "上市", "筹集", "募资",
  "停产", "中断", "受损", "损失", "关闭", "污染", "劳工争议", "人权争议",
  "raise", "funding", "investment", "invests", "acquisition", "acquires", "merger", "partnership", "signs", "launches", "commits", "builds",
  "power purchase agreement", "ppa", "bond", "ipo", "deal", "disruption", "damage", "shutdown", "pollution", "worker fatality",
];

function hits(text: string, terms: string[]): number {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function has(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function classifyContentType(
  item: Pick<ContentItem, "title" | "titleZh" | "summary" | "summaryZh" | "sourceName">,
  defaultType: ContentType = "观点",
): ContentType {
  const text = `${item.title || ""} ${item.titleZh || ""} ${item.summary || ""} ${item.summaryZh || ""}`.toLowerCase();
  const source = (item.sourceName || "").toLowerCase();

  if (has(source, ["crossref", "ssrn", "学术"]) || hits(text, ACADEMIC_TERMS) >= 3) return "学术";
  if (has(source, ["msci", "sustainalytics", "ecovadis"]) || hits(text, RATING_TERMS) >= 2) return "评级";
  // 对具体企业的处罚、起诉、停工等是企业风险事件，不是政策文本。
  const corporateEnforcement = hits(text, CORPORATE_ENFORCEMENT_TERMS) >= 1
    && (defaultType === "行业" || hits(text, CORPORATE_SUBJECT_TERMS) >= 1);
  if (corporateEnforcement) return "行业";
  if (hits(text, POLICY_TERMS) >= 1) return "政策";
  if (hits(text, INDUSTRY_TERMS) >= 1) return "行业";
  return defaultType;
}
