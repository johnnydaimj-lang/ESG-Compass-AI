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

function authorRoleFor(material: RawMaterial, tier: SourceTier): UnderstandingResult["authorRole"] {
  if (material.contentType === "学术") return "observer";
  if (tier === "T1" || tier === "T1_5") return "principal";
  if (tier === "SIGNAL") return "relayer";
  return "observer";
}

export function understandMaterial(material: RawMaterial, sourceTier: SourceTier): UnderstandingResult {
  const tags = [material.contentType, material.esgTopic || "合规与监管", material.region]
    .map((tag) => compactText(tag))
    .filter(Boolean);
  return {
    itemType: ITEM_TYPES[material.contentType],
    authorRole: authorRoleFor(material, sourceTier),
    tags: [...new Set(tags)].slice(0, 6),
    editorialJudgment: editorialJudgmentFromMaterial(material),
    titleZh: compactText(material.content.titleZh) || compactText(material.title),
    summaryZh: compactText(material.content.summaryZh) || compactText(material.summary),
  };
}
