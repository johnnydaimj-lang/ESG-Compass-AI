import type { ContentType } from "@/lib/contracts/content";
import type { RawMaterial, SourceTier, UnderstandingResult } from "@/lib/contracts/pipeline";
import { compactText } from "./text";
import { editorialJudgmentFromMaterial } from "./score";

const ITEM_TYPES: Record<ContentType, UnderstandingResult["itemType"]> = {
  政策: "policy_regulation",
  行业: "corporate_action",
  观点: "opinion_analysis",
  学术: "research_paper",
  评级: "rating_action",
};

export function understandMaterial(material: RawMaterial, _sourceTier: SourceTier): UnderstandingResult {
  const tags = [material.contentType, material.esgTopic || "合规与监管", material.region]
    .map((tag) => compactText(tag))
    .filter(Boolean);
  return {
    itemType: ITEM_TYPES[material.contentType],
    // Source tier and content type do not establish authorship or principal status.
    // This deterministic fallback has no authorship evidence; use the conservative role.
    authorRole: "relayer",
    tags: [...new Set(tags)].slice(0, 6),
    editorialJudgment: editorialJudgmentFromMaterial(material),
    titleZh: compactText(material.content.titleZh) || compactText(material.title),
    summaryZh: compactText(material.content.summaryZh) || compactText(material.summary),
  };
}
