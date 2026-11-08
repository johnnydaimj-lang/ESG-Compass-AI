import { normalizeText } from "./text";

const EDITORIAL_FIRST_PERSON = /我们|我们的|我方|我司|本文|本刊|本报|本台|本网站|笔者|编辑部/u;
const META_SUMMARY_COMMENTARY = /现有中文摘要|原文摘要仅|本文仅说明/u;

function comparable(value: unknown): string {
  return normalizeText(value)
    .replace(/\s+20\d{2}\s+\d{1,2}\s+\d{1,2}$/u, "")
    .replace(/\s+20\d{2}\s+\d{1,2}$/u, "")
    .trim();
}

export function hasEditorialFirstPerson(value: unknown): boolean {
  return EDITORIAL_FIRST_PERSON.test(String(value || ""));
}

export function hasMetaSummaryCommentary(value: unknown): boolean {
  return META_SUMMARY_COMMENTARY.test(String(value || ""));
}

export function stripMetaSummaryCommentary(value: unknown): string {
  return String(value || "")
    .split(/(?<=[。！？])/u)
    .filter((sentence) => !META_SUMMARY_COMMENTARY.test(sentence))
    .join("")
    .trim();
}

export function toThirdPersonVoice(value: unknown): string {
  return String(value || "")
    .replace(/阅读我们关于/g, "相关材料梳理了")
    .replace(/阅读我们的/g, "相关材料梳理了")
    .replace(/我们关于/g, "该机构关于")
    .replace(/我们的/g, "该机构的")
    .replace(/我方|我司/g, "相关机构")
    .replace(/我们/g, "该机构")
    .replace(/本文/g, "该材料")
    .replace(/本刊|本报|本台|本网站|笔者|编辑部/g, "该来源")
    .replace(/\s{2,}/g, " ")
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
  if (hasEditorialFirstPerson(value)) return false;
  if (hasMetaSummaryCommentary(value)) return false;
  return !isTitleEcho(title, value);
}
