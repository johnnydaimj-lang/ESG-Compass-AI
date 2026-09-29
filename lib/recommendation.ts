// 推荐理由展示工具：先给一句分析理由，再把信号/可转化/影响等拆成结构化要点。
export interface RecommendSource {
  recommendReason?: string;
  recommendBullets?: string[];
  whyMatters?: string;
  summary?: string;
  summaryZh?: string;
}

export function getRecommendReason(item: RecommendSource): string | null {
  const explicit = (item.recommendReason || "").trim();
  if (explicit) return explicit;
  const summary = ((item.summaryZh || item.summary) || "").trim();
  if (summary) {
    const first = summary.split(/[。；]/)[0].trim();
    if (first && first.length >= 10) return first + "。";
  }
  return null;
}

export function getRecommendBullets(item: RecommendSource): string[] {
  if (item.recommendBullets && item.recommendBullets.length > 0) {
    return item.recommendBullets.slice(0, 8);
  }
  const raw = String(item.whyMatters || "").trim();
  if (!raw) return [];
  const body = raw.split("。建议")[0] || raw.split("。")[0] || raw;
  const out: string[] = [];
  const seen = new Set<string>();
  body.split(" | ").forEach((part) => {
    part.split("；").forEach((chunk) => {
      const t = chunk.trim();
      if (!t || seen.has(t)) return;
      seen.add(t);
      out.push(t);
    });
  });
  return out.slice(0, 8);
}
