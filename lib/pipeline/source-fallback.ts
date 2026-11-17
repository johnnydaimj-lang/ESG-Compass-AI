import type { SourceConfig, SourceFallbackConfig } from "./collect";

export function buildFallbackSources(source: SourceConfig): SourceConfig[] {
  const { requiresEnv: _requiresEnv, fallbacks: _fallbacks, fallbackOnEmpty: _fallbackOnEmpty, ...base } = source;

  return (source.fallbacks || []).map((fallback: SourceFallbackConfig, index) => ({
    ...base,
    ...fallback,
    id: `${source.id}--fallback-${index + 1}`,
    name: fallback.name || `${source.name}备用通道 ${index + 1}`,
    url: fallback.url,
    type: fallback.type,
    contentType: fallback.contentType || source.contentType,
    region: fallback.region || source.region,
    enabled: true,
    requiresEnv: fallback.requiresEnv,
    fallbacks: [],
    fallbackOnEmpty: false,
  }));
}
