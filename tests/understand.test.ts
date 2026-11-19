import assert from "node:assert/strict";
import test from "node:test";
import type { RawMaterial, SourceTier } from "../lib/contracts/pipeline";
import { understandMaterial } from "../lib/pipeline/understand";

test("source tier and category cannot establish principal or original-author status", () => {
  const material: RawMaterial = {
    id: "report", title: "机构解读披露规则", summary: "某机构讨论披露规则的影响。",
    sourceName: "专业媒体", sourceUrl: "https://example.com/report", publishedAt: "2026-11-19",
    contentType: "政策", region: "全球",
    content: { id: "report", title: "机构解读披露规则", summary: "某机构讨论披露规则的影响。",
      sourceName: "专业媒体", sourceUrl: "https://example.com/report", publishedAt: "2026-11-19",
      contentType: "政策", region: "全球", importanceLevel: "中", esgTopic: "合规与监管" },
  };
  const before = JSON.stringify(material);
  for (const tier of ["T1", "T1_5", "T2", "SIGNAL"] as SourceTier[]) {
    const result = understandMaterial(material, tier);
    assert.equal(result.authorRole, "relayer");
    assert.equal(result.itemType, "policy_regulation");
    assert.equal(result.titleZh, material.title);
  }
  const research = { ...material, contentType: "学术" as const };
  assert.equal(understandMaterial(research, "T1").authorRole, "relayer");
  assert.equal(JSON.stringify(material), before);
});
