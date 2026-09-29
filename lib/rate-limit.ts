// 轻量级进程内滑动窗口限流，适配 Vercel serverless（按实例生效）。

const buckets = new Map<string, number[]>();
const MAX_ENTRIES = 5000;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}

export function isRateLimited(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return true;
  }
  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > MAX_ENTRIES) {
    for (const [entryKey, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(entryKey);
    }
  }
  return false;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
