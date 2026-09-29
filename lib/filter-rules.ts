// 筛选规则与模型配置（服务端读取）
// 规则统一存放在 data/filter-rules.json，/ops/filters 可审阅与修改。

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface FilterRules {
  version: number;
  updatedAt: string;
  regulations?: {
    contentTypes?: string[];
    matchMode?: string;
  };
  hotspot?: {
    minIndependentSources?: number;
    minAuthoritativeSources?: number;
    minSecondarySources?: number;
    detectionWindowHours?: number;
    minImpactScore?: number;
    stopNoUpdateDays?: number;
    stopOnConsensus?: boolean;
  };
  manualReview?: {
    enabled?: boolean;
    academicExempt?: boolean;
    minIndependentSources?: number;
    politicalClaimPatterns?: string[];
    learning?: {
      enabled?: boolean;
      repeatSourceRejectThreshold?: number;
      repeatSignalRejectThreshold?: number;
      signalTerms?: string[];
    };
    reason?: string;
  };
}

const RULES_FILE = resolve(process.cwd(), "data", "filter-rules.json");

export function loadFilterRules(): FilterRules {
  try {
    if (!existsSync(RULES_FILE)) return { version: 1, updatedAt: "" };
    return JSON.parse(readFileSync(RULES_FILE, "utf-8")) as FilterRules;
  } catch {
    return { version: 1, updatedAt: "" };
  }
}
