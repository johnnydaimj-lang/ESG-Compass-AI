// ESG Compass — 输出裁剪与摘要切片
// 完整原文保留在发布快照；受控内容 API 按 Token 预算与字符切片裁剪。

export const CONTENT_API_TOKEN_BUDGET = Number(process.env.CONTENT_API_TOKEN_BUDGET || 2600);
export const CONTENT_API_SLICE_CHARS = Number(process.env.CONTENT_API_SLICE_CHARS || 900);

export function estimateTokens(text: string): number {
  return Math.ceil(String(text || "").length / 1.8);
}

export function sliceLongText(text: string, maxChars: number = CONTENT_API_SLICE_CHARS): string {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  const lines = t.split(/\r?\n/);
  const chunks: string[] = [];
  let used = 0;
  for (const line of lines) {
    const chunk = (chunks.length ? "\n" : "") + line;
    if (used + chunk.length > maxChars) {
      chunks.push(chunk.slice(0, Math.max(0, maxChars - used)));
      break;
    }
    chunks.push(chunk);
    used += chunk.length;
  }
  return chunks.join("") + "\n[原文已切片：完整文档保留在内容库存储中]";
}

export function trimContextByPriority(
  parts: { priority: number; content: string }[],
  maxTokens: number
): string[] {
  const sorted = parts.slice().sort((a, b) => a.priority - b.priority);
  const out: string[] = [];
  let used = 0;
  for (const part of sorted) {
    const tokens = estimateTokens(part.content);
    if (used + tokens > maxTokens) {
      const remaining = Math.max(maxTokens - used, 20);
      out.push(part.content.slice(0, Math.floor(remaining * 1.8)) + "\n[已按上下文策略裁剪…]");
      break;
    }
    out.push(part.content);
    used += tokens;
  }
  return out;
}

export interface ContextSource {
  title: string;
  summary: string;
  content?: string;
}

export interface ContentApiContextOptions {
  maxTokens?: number;
  maxSliceChars?: number;
}

export function buildContentApiContext(
  event: { title: string; summary: string; esgTopic: string } | null,
  sources: ContextSource[],
  options: ContentApiContextOptions = {}
): { context: string; tokenEstimate: number; budget: number; slicedCount: number; truncated: boolean } {
  const maxTokens = options.maxTokens ?? CONTENT_API_TOKEN_BUDGET;
  const maxSliceChars = options.maxSliceChars ?? CONTENT_API_SLICE_CHARS;
  const parts: { priority: number; content: string }[] = [];
  let slicedCount = 0;

  if (event) {
    parts.push({
      priority: 1,
      content: "用户正在查看的事件：\n标题：" + event.title + "\n摘要：" + event.summary + "\nESG 议题：" + event.esgTopic + "\n",
    });
  }

  sources.forEach((source, i) => {
    const raw = String(source.content || "");
    const sliced = raw.length > maxSliceChars ? sliceLongText(raw, maxSliceChars) : raw;
    if (sliced.length < raw.length) slicedCount += 1;
    parts.push({
      priority: 2 + Math.min(i, 3),
      content: "---\n标题：" + source.title + "\n摘要：" + source.summary + "\n相关内容（摘要切片）：" + sliced + "\n",
    });
  });

  const beforeTokens = parts.reduce((sum, p) => sum + estimateTokens(p.content), 0);
  const trimmed = trimContextByPriority(parts, maxTokens);
  const context = trimmed.join("\n");
  return {
    context,
    tokenEstimate: estimateTokens(context),
    budget: maxTokens,
    slicedCount,
    truncated: beforeTokens > maxTokens,
  };
}
