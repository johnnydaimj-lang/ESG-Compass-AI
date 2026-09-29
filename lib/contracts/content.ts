export const CONTENT_TYPES = ["政策", "行业", "观点", "学术", "评级"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ImportanceLevel = "高" | "中" | "低";

export const SASB_TOPICS = [
  "温室气体排放",
  "气候风险",
  "供应链管理",
  "水资源管理",
  "人权与劳工",
  "合规与监管",
  "数据安全",
  "社区关系",
  "废弃物管理",
  "产品质量与安全",
] as const;
export type SasbTopic = (typeof SASB_TOPICS)[number];

interface ImpactBase {
  relevance: "高" | "中" | "低";
  whyThisMatters: string;
}

export interface PolicyImpact extends ImpactBase {
  contentType: "政策";
  impactLevel: "高" | "中" | "低";
  impactScore: number;
  scoreBreakdown: { scope: number; magnitude: number; enforceability: number };
  affectedIndustries: string[];
  timeline: "已生效" | "即将生效" | "待观察";
  effectiveDate?: string;
  actionsRequired: string[];
  keyClauses: string[];
}

export interface AcademicImpact extends ImpactBase {
  contentType: "学术";
  researchFinding: string;
  methodologyQuality: "高" | "中" | "低";
  practicalImplication: string;
  sourceCredibility: "高" | "中" | "低";
}

export interface ExpertImpact extends ImpactBase {
  contentType: "观点";
  sourceCredibility: "高" | "中" | "低";
  keyArgument: string;
  position: "主流共识" | "争议观点" | "前瞻判断";
}

export interface RatingImpact extends ImpactBase {
  contentType: "评级";
  impactLevel: "高" | "中" | "低";
  affectedSectors: string[];
  actionsRequired: string[];
}

export interface IndustryImpact extends ImpactBase {
  contentType: "行业";
  affectedSectors: string[];
  actionsRequired: string[];
}

export type ImpactAnalysis = PolicyImpact | AcademicImpact | ExpertImpact | RatingImpact | IndustryImpact;

export interface SourceRef {
  sourceName: string;
  sourceUrl: string;
  title?: string;
  publishedAt?: string;
}

export interface StructuredFact {
  title: string;
  subject: string;
  action: string;
  object: string;
  occurredAt: string | null;
}

export interface PipelineMetadata {
  score: number;
  scoreThreshold: number;
  scorePass: boolean;
  sourceTier: string;
  storyId: string;
  heat: number;
  tags: string[];
  fact?: StructuredFact;
  pipelineVersion: string;
  promptVersion?: string;
}

export interface ContentItem {
  impactAnalysis?: ImpactAnalysis;
  id: string;
  title: string;
  contentType: ContentType;
  region: string;
  publishedAt: string;
  importanceLevel: ImportanceLevel;
  summary: string;
  titleZh?: string;
  summaryZh?: string;
  body?: string;
  bodyZh?: string;
  sourceRefs?: SourceRef[];
  sourceName: string;
  sourceUrl: string;
  esgTopic: string;
  aiDraft?: boolean;
  recommended?: boolean;
  whyMatters?: string;
  recommendReason?: string;
  recommendBullets?: string[];
  articleUrl?: string;
  journalName?: string;
  journalImpactFactor?: number;
  citationCount?: number;
  readCount?: number;
  academicScore?: number;
  academicRelevance?: number;
  academicJournalScore?: number;
  academicCitationScore?: number;
  academicReadScore?: number;
  academicExcluded?: boolean;
  pipeline?: PipelineMetadata;
}

export function getContentLink(item: Pick<ContentItem, "articleUrl" | "sourceUrl">): string {
  return item.articleUrl ?? item.sourceUrl;
}

export function getHomeTitle(item: Pick<ContentItem, "title" | "titleZh">): string {
  return (item.titleZh || "").trim() || item.title;
}

export function getHomeSummary(item: Pick<ContentItem, "summary" | "summaryZh">): string {
  return (item.summaryZh || "").trim() || item.summary;
}

export function summarizeForHome(text: string, max = 300): string {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"), cut.lastIndexOf("；"), cut.lastIndexOf(". "));
  return (boundary > max * 0.6 ? cut.slice(0, boundary + 1) : cut).trim() + "…";
}
