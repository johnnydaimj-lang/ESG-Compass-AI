import type {
  ClusterRelation,
  RawMaterial,
  SourceTier,
  StoryCluster,
  StructuredFact,
} from "@/lib/contracts/pipeline";
import { cosineSimilarity, daysBetween, stableHash } from "./text";

export interface ClusterInput {
  material: RawMaterial;
  sourceId: string;
  sourceTier: SourceTier;
  editorialSource: boolean;
  fact: StructuredFact;
}

function relationFor(score: number, nearDuplicateFloor: number, similarityFloor: number): ClusterRelation {
  if (score >= nearDuplicateFloor) return "SAME_OCCURRENCE";
  if (score >= similarityFloor) return "SAME_STORY";
  return "UNRELATED";
}

export function clusterMaterials(
  items: ClusterInput[],
  options: {
    similarityFloor?: number;
    nearDuplicateFloor?: number;
    recallDays?: number;
  } = {}
): StoryCluster[] {
  const similarityFloor = options.similarityFloor ?? 0.6;
  const nearDuplicateFloor = options.nearDuplicateFloor ?? 0.92;
  const recallDays = options.recallDays ?? 14;
  const sorted = items.slice().sort((a, b) => a.material.publishedAt.localeCompare(b.material.publishedAt));
  const clusters: StoryCluster[] = [];

  for (const item of sorted) {
    const text = `${item.material.title} ${item.material.summary} ${item.material.body || ""}`;
    let best: { cluster: StoryCluster; score: number } | null = null;

    for (const cluster of clusters) {
      if (daysBetween(cluster.latestPublishedAt, item.material.publishedAt) > recallDays) continue;
      const root = items.find((candidate) => candidate.material.id === cluster.rootId);
      if (!root) continue;
      const rootText = `${root.material.title} ${root.material.summary} ${root.material.body || ""}`;
      const topicAligned = !root.material.esgTopic
        || !item.material.esgTopic
        || root.material.esgTopic === item.material.esgTopic;
      if (!topicAligned && root.material.contentType !== item.material.contentType) continue;
      const score = cosineSimilarity(text, rootText);
      if (score >= similarityFloor && (!best || score > best.score)) best = { cluster, score };
    }

    if (!best) {
      const id = `story-${stableHash(`${item.material.id}:${item.material.publishedAt}`)}`;
      clusters.push({
        id,
        rootId: item.material.id,
        title: item.material.content.titleZh || item.material.title,
        digest: item.material.content.summaryZh || item.material.summary,
        latest: item.material.content.summaryZh || item.material.summary,
        memberIds: [item.material.id],
        facts: [item.fact],
        participants: [item.sourceId],
        firstPublishedAt: item.material.publishedAt,
        latestPublishedAt: item.material.publishedAt,
        heat: 0,
        relations: [{ memberId: item.material.id, relation: "SAME_OCCURRENCE", confidence: 1 }],
      });
      continue;
    }

    const relation = relationFor(best.score, nearDuplicateFloor, similarityFloor);
    best.cluster.memberIds.push(item.material.id);
    best.cluster.facts.push(item.fact);
    best.cluster.participants = [...new Set([...best.cluster.participants, item.sourceId])];
    best.cluster.latest = item.material.content.summaryZh || item.material.summary;
    best.cluster.latestPublishedAt = item.material.publishedAt;
    best.cluster.relations.push({ memberId: item.material.id, relation, confidence: best.score });
  }

  return clusters;
}
