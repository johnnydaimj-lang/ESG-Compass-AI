import type { RawMaterial, StructuredFact } from "@/lib/contracts/pipeline";
import { compactText, stableHash } from "./text";

const ACTIONS = [
  "发布",
  "批准",
  "通过",
  "修订",
  "生效",
  "提议",
  "启动",
  "处罚",
  "调查",
  "披露",
  "评级",
  "收购",
  "启动征求意见",
  "publish",
  "approve",
  "adopt",
  "revise",
  "propose",
  "enforce",
];

function extractAction(text: string): string {
  const normalized = text.toLowerCase();
  const matched = ACTIONS.find((action) => normalized.includes(action.toLowerCase()));
  return matched || "发布";
}

export function structureMaterial(material: RawMaterial): StructuredFact {
  const title = compactText(material.content.titleZh || material.title);
  const summary = compactText(material.content.summaryZh || material.summary);
  const action = extractAction(`${title} ${summary}`);
  const dateMatch = summary.match(/\b(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/);
  const occurredAt = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
    : material.publishedAt.slice(0, 10);
  return {
    title: title.slice(0, 30),
    subject: compactText(material.sourceName).slice(0, 40),
    action,
    object: title.slice(0, 80),
    occurredAt: occurredAt || null,
  };
}

export function factKey(fact: StructuredFact): string {
  return stableHash(`${fact.subject}|${fact.action}|${fact.object}|${fact.occurredAt || ""}`);
}
