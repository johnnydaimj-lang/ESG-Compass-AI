import { normalizeText } from "./text";

function comparable(value: unknown): string {
  return normalizeText(value)
    .replace(/\s+20\d{2}\s+\d{1,2}\s+\d{1,2}$/u, "")
    .replace(/\s+20\d{2}\s+\d{1,2}$/u, "")
    .trim();
}

export function isTitleEcho(title: unknown, summary: unknown): boolean {
  const normalizedTitle = comparable(title);
  const normalizedSummary = comparable(summary);
  if (!normalizedTitle || !normalizedSummary) return false;
  if (normalizedTitle === normalizedSummary) return true;

  const lengthRatio = normalizedSummary.length / normalizedTitle.length;
  const containsTitle = normalizedSummary.includes(normalizedTitle)
    || normalizedTitle.includes(normalizedSummary);
  return containsTitle
    && normalizedSummary.length <= normalizedTitle.length + 16
    && lengthRatio >= 0.75
    && lengthRatio <= 1.35;
}

export function isUsableGeneratedSummary(
  title: unknown,
  summary: unknown,
  options: { minLength?: number; maxLength?: number } = {},
): boolean {
  const value = String(summary || "").trim();
  const minLength = options.minLength ?? 40;
  const maxLength = options.maxLength ?? 300;
  if (value.length < minLength || value.length > maxLength) return false;
  if (!/[\u3400-\u9fff]/.test(value)) return false;
  if (!/[。！？]$/.test(value)) return false;
  if (/\[(?:\.{2,}|…)?\]|(?:\.{3,}|…{2,})/u.test(value)) return false;
  if (/<[^>]+>|&(?:nbsp|amp|#x?[0-9a-f]+);/i.test(value)) return false;
  return !isTitleEcho(title, value);
}
