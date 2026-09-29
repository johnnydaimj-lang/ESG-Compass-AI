const CJK_RE = /[\u3400-\u9fff]/;
const LATIN_RE = /[a-z0-9][a-z0-9_-]*/g;
const CJK_RUN_RE = /[\u3400-\u9fff]+/g;

export function compactText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&hellip;": "\u2026",
  "&middot;": "\u00b7",
};

export function decodeHtmlEntities(value: string): string {
  return String(value ?? "")
    .replace(/&#x?[0-9a-fA-F]+;/g, (entity) => {
      const hex = /^&#x/i.test(entity);
      const code = hex ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
      if (Number.isNaN(code)) return entity;
      if (code === 0 || (code >= 0x200b && code <= 0x200f)) return "";
      return String.fromCodePoint(code);
    })
    .replace(/&[a-zA-Z]+;/g, (entity) => NAMED_ENTITIES[entity] ?? entity);
}

export function stripTruncationMarkers(value: string): string {
  return String(value ?? "")
    .replace(/\[(?:\.{2,}|\u2026+)?\]/gi, "")
    .replace(/(?:\s*(?:\.{3,}|\u2026+))+$/g, "")
    .trim();
}

export function completeSentence(value: string): string {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/[.!?。！？；;]$/.test(text)) return text;
  const cut = Math.max(
    text.lastIndexOf(". "),
    text.lastIndexOf("! "),
    text.lastIndexOf("? "),
    text.lastIndexOf("。"),
    text.lastIndexOf("！"),
    text.lastIndexOf("？"),
    text.lastIndexOf("; "),
    text.lastIndexOf("；"),
  );
  if (cut > 0) return text.slice(0, cut + 1).trim();
  // 单句被截断、没有句末标点时，去掉最后一个逗号后的残句。
  const comma = Math.max(text.lastIndexOf(","), text.lastIndexOf("，"));
  if (comma > 0 && text.length - comma - 1 <= 30) return text.slice(0, comma).trim();
  return text;
}

export function cleanSummaryText(value: unknown): string {
  return completeSentence(
    stripTruncationMarkers(
      decodeHtmlEntities(
        String(value ?? "")
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " "),
      ),
    ),
  );
}

export function normalizeText(value: unknown): string {
  return compactText(value)
    .toLowerCase()
    .replace(/[“”"'’‘`]/g, "")
    .replace(/[^\p{L}\p{N}\u3400-\u9fff]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: unknown): string[] {
  const text = normalizeText(value);
  const tokens = new Set<string>();
  for (const word of text.match(LATIN_RE) || []) {
    if (word.length >= 2) tokens.add(word);
  }
  for (const run of text.match(CJK_RUN_RE) || []) {
    if (CJK_RE.test(run)) {
      if (run.length === 1) tokens.add(run);
      for (let i = 0; i < run.length - 1; i += 1) tokens.add(run.slice(i, i + 2));
      if (run.length <= 4) tokens.add(run);
    }
  }
  return [...tokens];
}

export function cosineSimilarity(left: string, right: string): number {
  const a = new Map<string, number>();
  const b = new Map<string, number>();
  for (const token of tokenize(left)) a.set(token, (a.get(token) || 0) + 1);
  for (const token of tokenize(right)) b.set(token, (b.get(token) || 0) + 1);
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of a.values()) normA += value * value;
  for (const [token, value] of b) {
    normB += value * value;
    dot += value * (a.get(token) || 0);
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function stableHash(value: unknown): string {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function daysBetween(left: string, right: string): number {
  const a = Date.parse(`${left.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${right.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / 86_400_000;
}
