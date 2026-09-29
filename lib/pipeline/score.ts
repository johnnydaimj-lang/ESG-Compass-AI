import type { ContentType } from "@/lib/contracts/content";
import type { RawMaterial, ScoreAxes, ScoreDecision, ScoreRun, SourceTier } from "@/lib/contracts/pipeline";
import { SCORE_WEIGHTS, SELECTION_THRESHOLDS, UNDERSTAND_FLOOR } from "./config";
import { compactText, normalizeText, stableHash } from "./text";

const clamp10 = (value: number) => Math.max(0, Math.min(10, Math.round(value)));

export function scoreFromAxes(contentType: ContentType, axes: ScoreAxes): number {
  const weights = SCORE_WEIGHTS[contentType];
  const values = [
    axes.significance,
    axes.novelty,
    axes.credibility,
    axes.resonance,
    axes.actionability,
  ];
  return Math.round(values.reduce((sum, value, index) => sum + clamp10(value) * weights[index], 0));
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => count + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}

export function heuristicAxes(material: RawMaterial, sourceTier: SourceTier): ScoreAxes {
  const text = normalizeText(`${material.title} ${material.summary} ${material.body || ""}`);
  const importance = material.content.importanceLevel;
  const significanceBase = importance === "高" ? 8 : importance === "中" ? 6 : 4;
  const actionSignals = countMatches(text, [
    "生效",
    "实施",
    "生效日期",
    "征求意见",
    "修订",
    "处罚",
    "强制",
    "准则",
    "指引",
    "deadline",
    "effective",
    "enforcement",
    "regulation",
  ]);
  const noveltySignals = countMatches(text, [
    "发布",
    "首次",
    "更新",
    "修订",
    "提议",
    "新规",
    "新标准",
    "launch",
    "proposal",
    "update",
    "revision",
  ]);
  const credibilityBase: Record<SourceTier, number> = { T1: 9, T1_5: 8, T2: 6, SIGNAL: 4 };
  const regionBoost = material.region === "全球" ? 1 : 0;

  return {
    significance: clamp10(significanceBase + (material.contentType === "政策" ? 1 : 0)),
    novelty: clamp10(5 + Math.min(3, noveltySignals)),
    credibility: clamp10(credibilityBase[sourceTier] - (noveltySignals > 2 ? 1 : 0)),
    resonance: clamp10(6 + regionBoost + (material.contentType === "观点" ? 1 : 0)),
    actionability: clamp10(3 + Math.min(6, actionSignals * 1.5)),
  };
}

function nudgeAxes(axes: ScoreAxes, materialId: string): ScoreAxes {
  const hash = Number.parseInt(stableHash(materialId).slice(0, 4), 36);
  const direction = hash % 2 === 0 ? 1 : -1;
  return {
    ...axes,
    novelty: clamp10(axes.novelty + direction),
  };
}

export function runHeuristicScores(material: RawMaterial, sourceTier: SourceTier): [ScoreRun, ScoreRun] {
  const firstAxes = heuristicAxes(material, sourceTier);
  const secondAxes = nudgeAxes(firstAxes, `${material.id}:second`);
  return [
    { axes: firstAxes, score: scoreFromAxes(material.contentType, firstAxes) },
    { axes: secondAxes, score: scoreFromAxes(material.contentType, secondAxes) },
  ];
}

export function decideSelection(
  runs: [ScoreRun, ScoreRun],
  sourceTier: SourceTier,
  options: { threshold?: number; understandFloor?: number } = {}
): ScoreDecision {
  const threshold = options.threshold ?? SELECTION_THRESHOLDS[sourceTier];
  const understandFloor = options.understandFloor ?? UNDERSTAND_FLOOR;
  const displayScore = Math.floor((runs[0].score + runs[1].score) / 2);
  const selected = sourceTier !== "SIGNAL"
    && runs[0].score + runs[1].score >= threshold * 2
    && runs[0].score >= understandFloor
    && runs[1].score >= understandFloor;
  const reason = sourceTier === "SIGNAL"
    ? "信号源只参与热度，不进入精选"
    : selected
      ? `两次独立评分达到 ${threshold} 分门槛`
      : `未达到 ${threshold} 分门槛`;
  return { runs, displayScore, threshold, understandFloor, selected, reason };
}

export function editorialJudgmentFromMaterial(material: RawMaterial): string {
  const explicit = compactText(material.content.recommendReason);
  if (explicit) return explicit.slice(0, 90);
  const summary = compactText(material.content.summaryZh || material.content.summary);
  const sentence = summary.split(/[。；;]/)[0]?.trim() || "";
  return sentence.length >= 12 ? `${sentence.slice(0, 86)}。` : "";
}

const AXIS_LABELS: Record<keyof ScoreAxes, string> = {
  significance: "实质分量",
  novelty: "信息增量",
  credibility: "证据强度",
  resonance: "读者相关度",
  actionability: "可操作性",
};

export function recommendReasonFor(material: RawMaterial, decision: ScoreDecision): string {
  const axes = (Object.keys(AXIS_LABELS) as Array<keyof ScoreAxes>)
    .map((key) => ({ key, value: (decision.runs[0].axes[key] + decision.runs[1].axes[key]) / 2 }))
    .sort((a, b) => b.value - a.value);
  const top = axes[0];
  const topic = material.esgTopic || "ESG";
  const region = material.region || "全球";
  return `${AXIS_LABELS[top.key]}较突出，涉及${topic}${region !== "全球" ? `的${region}` : ""}动向，综合评分 ${decision.displayScore}。`;
}
