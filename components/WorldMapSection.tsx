"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, FileText, MapPin, MousePointerClick, RotateCcw } from "lucide-react";
import world from "@svg-maps/world";
import { normalizeRegion, regionCountryIds } from "@/lib/world-regions";
import type { ZoneRegion } from "@/lib/zones-data";

interface WorldLocation {
  id: string;
  name: string;
  path: string;
}

export interface LegacyMilestone {
  date: string;
  title: string;
  summary: string;
  region?: string;
}

export interface ContentRegulationLink {
  region: string;
  title: string;
  href: string;
  sourceName?: string;
  publishedAt?: string;
}

function contentCount(region: ZoneRegion): number {
  return (region.milestones?.length || 0) + (region.regulations?.length || 0);
}

export default function WorldMapSection({ regions, zoneName, fallbackMilestones, contentRegulations }: {
  regions: ZoneRegion[];
  zoneName: string;
  fallbackMilestones?: LegacyMilestone[];
  contentRegulations?: ContentRegulationLink[];
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ZoneRegion>();
    for (const region of regions) {
      const key = normalizeRegion(region.name);
      const existing = map.get(key);
      if (existing) {
        existing.milestones = [...(existing.milestones || []), ...(region.milestones || [])];
        existing.regulations = [...(existing.regulations || []), ...(region.regulations || [])];
      } else {
        map.set(key, {
          name: key,
          milestones: [...(region.milestones || [])],
          regulations: [...(region.regulations || [])],
        });
      }
    }
    if (map.size === 0 && fallbackMilestones?.length) {
      const byRegion = new Map<string, ZoneRegion>();
      for (const m of fallbackMilestones) {
        const key = normalizeRegion(m.region);
        if (!byRegion.has(key)) byRegion.set(key, { name: key, milestones: [], regulations: [] });
        byRegion.get(key)!.milestones!.push({ date: m.date, title: m.title, summary: m.summary });
      }
      for (const [key, value] of byRegion) map.set(key, value);
    }
    for (const region of map.values()) {
      region.milestones?.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [regions, fallbackMilestones]);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;

  function regionForCountry(id: string): string | null {
    for (const region of groups.keys()) {
      if (region === "全球" || region === "国际") continue;
      if (regionCountryIds(region).includes(id)) return region;
    }
    return null;
  }

  const highlight = active ? new Set(regionCountryIds(active)) : new Set<string>();
  const shown = active ? groups.get(active) : null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-ink">世界地图里程碑</h2>
          <p className="flex items-center gap-1.5 text-[12px] text-ink-faint">
            <MousePointerClick size={13} />
            悬停或点击国家/地区，查看该地区的执法时间线、监管要求、关键文件与风险来源
          </p>
        </div>
        {active && (
          <button
            type="button"
            onClick={() => { setSelected(null); setHovered(null); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep"
          >
            <RotateCcw size={13} />回到地图
          </button>
        )}
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-line bg-surface">
        <svg viewBox={world.viewBox} className="h-auto w-full" role="group" aria-label={`${zoneName} 世界地图里程碑`}>
          {(world.locations as WorldLocation[]).map((location) => {
            const region = regionForCountry(location.id);
            const isActive = highlight.has(location.id);
            const regionData = region ? groups.get(region) : null;
            const hasContent = Boolean(regionData && contentCount(regionData));
            return (
              <path
                key={location.id}
                d={location.path}
                tabIndex={0}
                role="button"
                aria-label={region ? `${location.name}（${region}）` : location.name}
                onMouseEnter={() => region && setHovered(region)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => region && setHovered(region)}
                onBlur={() => setHovered(null)}
                onClick={() => region && setSelected(region)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); region && setSelected(region); } }}
                className="cursor-pointer outline-none"
                style={{
                  fill: isActive ? "var(--color-brand)" : hasContent ? "var(--color-brand-soft)" : "var(--color-line)",
                  stroke: "var(--color-surface)",
                  strokeWidth: 0.6,
                  transition: "fill 120ms ease",
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {Array.from(groups.keys()).map((region) => {
          const regionData = groups.get(region)!;
          return (
            <button
              key={region}
              type="button"
              onClick={() => setSelected(region)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active === region
                  ? "border-brand-line bg-brand text-surface"
                  : "border-line bg-surface text-ink-soft hover:border-brand-line hover:text-brand-deep"
              }`}
            >
              <MapPin size={12} />
              {region}
              <span className="font-mono text-[10px] opacity-70">{contentCount(regionData)}</span>
            </button>
          );
        })}
      </div>

      {shown ? (
        <div className="space-y-6">
          {shown.milestones && shown.milestones.length > 0 ? (
            <div>
              <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-ink">里程碑时间线 · {active}</h3>
              <div className="relative pl-8 before:absolute before:left-3 before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-line-strong">
                {shown.milestones.map((m, i) => (
                  <div key={`${m.date}-${i}`} className="relative mb-6 last:mb-0">
                    <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-brand bg-surface" />
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <time className="font-mono text-[12px] text-ink-faint">{m.date}</time>
                      <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-deep">{active}</span>
                    </div>
                    <h4 className="mb-1 text-[15px] font-semibold text-ink">{m.title}</h4>
                    <p className="text-[13px] leading-relaxed text-ink-soft">{m.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : shown.regulations && shown.regulations.length > 0 ? null : (
            <div className="rounded-lg border border-dashed border-line-strong bg-surface px-5 py-6 text-center text-[12.5px] text-ink-faint">
              {active} 暂无内容
            </div>
          )}

          {shown.regulations && shown.regulations.length > 0 && (
            <div>
              <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-ink">监管要求 · {active}</h3>
              <div className="space-y-3">
                {shown.regulations.map((reg, i) => (
                  <div key={`${reg.title}-${i}`} className="rounded-lg border border-line bg-surface p-4">
                    <div className="mb-2 text-[14px] font-semibold text-ink">{reg.title}</div>
                    <p className="mb-3 text-[12.5px] leading-relaxed text-ink-soft">{reg.obligation}</p>
                    {(reg.appliesTo || reg.threshold || reg.timeline || reg.penalty) && (
                      <dl className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {reg.appliesTo ? (
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">适用对象</dt>
                            <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{reg.appliesTo}</dd>
                          </div>
                        ) : null}
                        {reg.threshold ? (
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">适用阈值</dt>
                            <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{reg.threshold}</dd>
                          </div>
                        ) : null}
                        {reg.timeline ? (
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">时间表</dt>
                            <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{reg.timeline}</dd>
                          </div>
                        ) : null}
                        {reg.penalty ? (
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-warn">违规后果</dt>
                            <dd className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{reg.penalty}</dd>
                          </div>
                        ) : null}
                      </dl>
                    )}
                    {reg.documents && reg.documents.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        {(() => {
                          const regionLinks = (contentRegulations || []).filter((r) => {
                            const a = String(r.region || "");
                            const b = String(active || "");
                            return a === b || (a && b && (a.includes(b) || b.includes(a)));
                          });
                          const docItems: { title: string; issuer?: string; note?: string; href?: string; sourceUrl?: string }[] = regionLinks.length > 0
                            ? regionLinks.map((r) => ({ title: r.title, issuer: r.sourceName || "", note: r.publishedAt || "", href: r.href }))
                            : reg.documents;
                          return docItems.map((doc, j) => (
                          <a key={`${doc.title}-${j}`} href={doc.href || doc.sourceUrl} target="_blank" rel="noreferrer"
                            className="group flex items-start justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-brand-line">
                            <span className="flex min-w-0 items-start gap-2">
                              <FileText size={13} className="mt-0.5 shrink-0 text-brand-deep" />
                              <span className="min-w-0">
                                <span className="block text-[12.5px] font-medium text-ink group-hover:text-brand-deep">{doc.title}</span>
                                <span className="block text-[11px] text-ink-faint">{doc.issuer || ""}{doc.note ? ` · ${doc.note}` : ""}</span>
                              </span>
                            </span>
                            <ArrowUpRight size={13} className="mt-1 shrink-0 text-ink-faint transition-colors group-hover:text-brand-deep" />
                          </a>
                          ));
                        })()}
                      </div>
                    )}
                    {reg.riskSources && reg.riskSources.length > 0 && (
                      <div className="space-y-1.5">
                        {reg.riskSources.map((risk, k) => (
                          <div key={`${risk.title}-${k}`} className="flex items-start gap-2 rounded-md bg-risk-soft px-3 py-2">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-risk" />
                            <div className="min-w-0">
                              <span className="text-[12px] font-medium text-ink">{risk.title}</span>
                              <span className="block text-[12px] leading-relaxed text-ink-soft">{risk.risk}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-5 py-6 text-center text-[12.5px] text-ink-faint">
          悬停或点击地图上的国家/地区，查看 {zoneName} 的执法时间线、监管要求、关键文件与风险来源
        </div>
      )}
    </section>
  );
}
