import type { ContentItem } from "@/lib/contracts/content";
import type {
  PrefilterResult,
  RawMaterial,
  ScoreDecision,
  StoryCluster,
  StructuredFact,
  UnderstandingResult,
} from "@/lib/contracts/pipeline";
import { PIPELINE_VERSION } from "@/lib/contracts/pipeline";

export interface ProcessedMaterial {
  material: RawMaterial;
  sourceTier: "T1" | "T1_5" | "T2" | "SIGNAL";
  prefilter: PrefilterResult;
  decision: ScoreDecision;
  understanding: UnderstandingResult;
  fact: StructuredFact;
  legacySelected: boolean;
}

export function toPublishedItem(
  processed: ProcessedMaterial,
  story: StoryCluster,
  options: { preserveLegacySelection?: boolean; promptVersion?: string } = {}
): ContentItem {
  const { material, decision, understanding, fact } = processed;
  const selected = decision.selected;
  return {
    ...material.content,
    titleZh: understanding.titleZh,
    summaryZh: understanding.summaryZh,
    esgTopic: material.esgTopic || material.content.esgTopic,
    recommended: selected,
    recommendReason: understanding.editorialJudgment || material.content.recommendReason,
    pipeline: {
      score: decision.displayScore,
      scoreThreshold: decision.threshold,
      scorePass: selected,
      sourceTier: processed.sourceTier,
      storyId: story.id,
      heat: story.heat,
      tags: understanding.tags,
      fact,
      pipelineVersion: PIPELINE_VERSION,
      promptVersion: options.promptVersion,
    },
  };
}

export function emptyClusterFor(material: RawMaterial, sourceId = material.id): StoryCluster {
  return {
    id: `story-${material.id}`,
    rootId: material.id,
    title: material.content.titleZh || material.title,
    digest: material.content.summaryZh || material.summary,
    latest: material.content.summaryZh || material.summary,
    memberIds: [material.id],
    facts: [],
    participants: [sourceId],
    firstPublishedAt: material.publishedAt,
    latestPublishedAt: material.publishedAt,
    heat: 0,
    relations: [{ memberId: material.id, relation: "SAME_OCCURRENCE", confidence: 1 }],
  };
}
