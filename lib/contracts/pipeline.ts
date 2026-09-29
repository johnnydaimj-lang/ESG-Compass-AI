import type { ContentItem, StructuredFact } from "./content";

export type { StructuredFact } from "./content";

export const PIPELINE_VERSION = "esg-v2.0.0";

export type SourceTier = "T1" | "T1_5" | "T2" | "SIGNAL";
export type PrefilterLabel = "PASS" | "BLOCK" | "UNKNOWN";
export type ClusterRelation =
  | "SAME_OCCURRENCE"
  | "SAME_STORY"
  | "UNRELATED"
  | "ROUNDUP";

export interface RawMaterial {
  id: string;
  sourceId?: string;
  title: string;
  summary: string;
  body?: string;
  sourceName: string;
  sourceUrl: string;
  articleUrl?: string;
  publishedAt: string;
  contentType: ContentItem["contentType"];
  region: string;
  esgTopic?: string;
  language?: string;
  sourceTier?: SourceTier;
  editorialSource?: boolean;
  legacyRecommended?: boolean;
  content: ContentItem;
}

export interface PrefilterResult {
  label: PrefilterLabel;
  reason: string;
}

export interface ScoreAxes {
  significance: number;
  novelty: number;
  credibility: number;
  resonance: number;
  actionability: number;
}

export interface ScoreRun {
  score: number;
  axes: ScoreAxes;
}

export interface ScoreDecision {
  runs: [ScoreRun, ScoreRun];
  displayScore: number;
  threshold: number;
  understandFloor: number;
  selected: boolean;
  reason: string;
}

export interface UnderstandingResult {
  itemType:
    | "policy_regulation"
    | "rating_action"
    | "research_paper"
    | "opinion_analysis"
    | "corporate_action"
    | "event";
  authorRole: "principal" | "observer" | "relayer";
  tags: string[];
  editorialJudgment: string;
  titleZh: string;
  summaryZh: string;
}

export interface StoryCluster {
  id: string;
  rootId: string;
  title: string;
  digest: string;
  latest: string;
  memberIds: string[];
  facts: StructuredFact[];
  participants: string[];
  firstPublishedAt: string;
  latestPublishedAt: string;
  heat: number;
  sourceNames?: string[];
  signalCount?: number;
  heat6hAgo?: number;
  trend?: "up" | "down" | "flat" | "new" | "unknown";
  trendPct?: number | null;
  badges?: Array<"new" | "surge" | "rising">;
  relations: Array<{ memberId: string; relation: ClusterRelation; confidence: number }>;
}

export interface HeatEvidence {
  sourceId: string;
  sourceTier: SourceTier;
  publishedAt: string;
  editorialSource: boolean;
}

export interface HeatResult {
  score: number;
  participants: number;
  editorialParticipants: number;
  signalParticipants: number;
  firstPublishedAt: string | null;
  recent6h: number;
  heat6hAgo: number;
  trend: "up" | "down" | "flat" | "new" | "unknown";
  trendPct: number | null;
  badges: Array<"new" | "surge" | "rising">;
  reason: string;
}

export interface HeatPoint {
  hour: string;
  heat: number;
  participants: number;
}

export interface HeatHistory {
  generatedAt: string;
  stories: Record<string, HeatPoint[]>;
}

export interface PublicationBundle {
  version: string;
  generatedAt: string;
  contents: ContentItem[];
  stories: StoryCluster[];
  hotspots: StoryCluster[];
  status: PipelineStatus;
}

export interface DailyReportItem {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  contentType: string;
  region: string;
  publishedAt: string;
  score?: number;
}

export interface DailyReportSection {
  label: string;
  items: DailyReportItem[];
}

export interface DailyReport {
  date: string;
  generatedAt: string;
  highlights: DailyReportItem[];
  sections: DailyReportSection[];
  stories: DailyReportItem[];
}

export interface PipelineStatus {
  pipelineVersion: string;
  command: string;
  mode: "snapshot" | "live" | "llm";
  startedAt: string;
  finishedAt: string;
  rawCount: number;
  passedPrefilter: number;
  blockedPrefilter: number;
  unknownPrefilter: number;
  scoredCount: number;
  selectedCount: number;
  storyCount: number;
  hotStoryCount: number;
  sourceCount: number;
  warnings: string[];
  sourceRuns: SourceRunStatus[];
  promptVersions: Record<string, string>;
}

export interface SourceRunStatus {
  id: string;
  name: string;
  type: string;
  state: "ok" | "failed" | "skipped";
  count: number;
  rawCount: number;
  error: string;
  warning: string;
  channel: string;
  fallbackUsed: boolean;
  lastFetchAt: string;
}
