const PERIODIC_ROUNDUP_PATTERNS = [
  /\bweek\s+in\s+review\b/i,
  /\bweekly\s+(?:roundup|review|digest|brief(?:ing)?)\b/i,
  /\bthis\s+week\s+in\s+(?:esg|sustainability|climate)\b/i,
  /(?:一周|本周|周度)(?:回顾|盘点|综述|要闻|摘要)/i,
  /(?:esg|可持续发展|气候|碳中和).{0,10}周报/i,
  /周报.{0,10}(?:esg|可持续发展|气候|碳中和)/i,
  /本周.{0,8}(?:esg|可持续发展|气候).{0,6}(?:新闻|动态|要闻)/i,
];

export function isPeriodicRoundupTitle(value: string): boolean {
  const title = String(value || "").trim();
  return title.length > 0 && PERIODIC_ROUNDUP_PATTERNS.some((pattern) => pattern.test(title));
}
