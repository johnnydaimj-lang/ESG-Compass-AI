import type { PrefilterResult, RawMaterial } from "@/lib/contracts/pipeline";
import { CLEAR_NOISE_TERMS, STRONG_ESG_TERMS } from "./config";
import { compactText, normalizeText } from "./text";

export function prefilterMaterial(material: RawMaterial): PrefilterResult {
  const title = compactText(material.title);
  const summary = compactText(material.summary);
  const body = compactText(material.body);
  const text = normalizeText(`${title} ${summary} ${body}`);

  if (!title && !summary && !body) {
    return { label: "UNKNOWN", reason: "材料为空，等待补充" };
  }
  if (CLEAR_NOISE_TERMS.some((term) => text.includes(normalizeText(term)))) {
    return { label: "BLOCK", reason: "招聘、报名或培训类内容" };
  }
  if (STRONG_ESG_TERMS.some((term) => text.includes(normalizeText(term)))) {
    return { label: "PASS", reason: "存在明确 ESG 相关事实" };
  }
  return { label: "UNKNOWN", reason: "相关性不足，保留待补材料" };
}

export function shouldStopAfterPrefilter(result: PrefilterResult): boolean {
  return result.label === "BLOCK";
}
