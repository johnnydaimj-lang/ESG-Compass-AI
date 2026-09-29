import type { ContentItem, ContentType } from "@/lib/contracts/content";

const ACADEMIC_TERMS = ["journal", "paper", "abstract", "preprint", "doi", "论文", "期刊", "学术", "crossref", "ssrn", "研究"];
const RATING_TERMS = ["评级", "rating", "msci", "sustainalytics", "ecovadis", "moody's", "fitch", "方法论", "methodology", "score"];
const POLICY_TERMS = ["法规", "条例", "指令", "标准", "指南", "指引", "框架", "准则", "规则", "法案", "提案", "披露要求", "regulation", "directive", "standard", "guidance", "framework", "legislation", "proposal", "rule", "投票", "监管", "执法"];
const INDUSTRY_TERMS = ["融资", "投资", "收购", "并购", "合作", "发行", "债券", "基金", "上市", "罚款", "处罚", "诉讼", "筹集", "募资", "raise", "funding", "investment", "acquisition", "merger", "partnership", "fine", "penalty", "lawsuit", "bond", "ipo", "deal"];

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
  if (hits(text, POLICY_TERMS) >= 1) return "政策";
  if (hits(text, INDUSTRY_TERMS) >= 1) return "行业";
  return defaultType;
}
