export const CONTENT_SIGNAL_SCHEMA_VERSION = "content-signal/v1" as const;

export type ContentOpsCategory =
  | "policy"
  | "research"
  | "hotspot"
  | "market"
  | "corporate"
  | "other";

export type ContentSignalPriority = "P0" | "P1" | "P2";
export type ContentSignalStatus = "ready" | "needs_evidence" | "blocked";
export type ContentSourceGrade = "A" | "B" | "C";
export type EvidenceStatus = "verified" | "revise" | "blocked";

export interface SignalEvidence {
  id: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  sourceGrade: ContentSourceGrade;
  locator: string;
  claim: string;
  status: EvidenceStatus;
}

/**
 * A fact-bearing handoff from Employee 1 to Employee 2.
 *
 * `fact` and `evidence` are the only fields intended to carry factual claims.
 * `whyItMatters`, `potentialAngles`, and `watchpoints` are editorial guidance.
 */
export interface ContentSignal {
  schemaVersion: typeof CONTENT_SIGNAL_SCHEMA_VERSION;
  signalId: string;
  detectedAt: string;
  title: string;
  fact: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  category: ContentOpsCategory;
  region: string;
  sourceGrade: ContentSourceGrade;
  isPrimarySource: boolean;
  evidenceCompleteness: number;
  trendClusterId?: string;
  whyItMatters: string;
  potentialAngles: string[];
  watchpoints: string[];
  stakeholders: string[];
  novelty: number;
  materiality: number;
  durability: number;
  priority: ContentSignalPriority;
  status: ContentSignalStatus;
  tags: string[];
  evidence: SignalEvidence[];
  provenance: {
    producer: "employee-1-content-scout";
    pipeline: "weekly" | "publication" | "manual";
    recordId: string;
    issueKey?: string;
    storyId?: string;
  };
}

export interface SignalCursor {
  version: 1;
  consumer: string;
  updatedAt: string;
  lastSignalId: string | null;
  lastDetectedAt: string | null;
  files: string[];
  positions: Record<string, number>;
}

export interface ContentOpsLatestIndex {
  schemaVersion: typeof CONTENT_SIGNAL_SCHEMA_VERSION;
  generatedAt: string;
  signalFile: string;
  totalSignals: number;
  readySignals: number;
  needsEvidenceSignals: number;
  priorityCounts: Record<ContentSignalPriority, number>;
  latestSignals: ContentSignal[];
}
