import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, BookOpen, Star, Flame } from "lucide-react";
import { getAllContents, getContentById, getContentLink, getHomeSummary, getHomeTitle, summarizeForHome } from "@/lib/esg-data";
import { getZonesByEventId, getZonesForContent } from "@/lib/zones-store";
import { getRegulationsForEvent } from "@/lib/regulations";
import { getRecommendReason, getRecommendBullets } from "@/lib/recommendation";
import { readHeatHistory } from "@/lib/publication-store";
import ImpactCard from "@/components/ImpactCard";
import HeatChart from "@/components/HeatChart";

function formatPublishedAt(value: string): string {
  if (!/[T\s]/.test(value)) return value;
  var d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

interface Props { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const item = getContentById(id);
  return { title: item ? getHomeTitle(item) : "事件详情" }
}

export default async function EventDetailPage({ params }: Props) {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const item = getContentById(id);
  if (!item) notFound();
  const heatHistory = readHeatHistory();
  const heatPoints = item.pipeline?.storyId ? heatHistory?.stories[item.pipeline.storyId] || [] : [];
  return (
    <article className="mx-auto max-w-3xl pb-16">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />返回ESG快讯
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{item.contentType}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{item.region}</span>
        <time className="font-mono text-ink-faint">{formatPublishedAt(item.publishedAt)}</time>
      </div>
      <h1 className="mb-6 text-2xl leading-snug font-semibold tracking-tight text-ink">{getHomeTitle(item)}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="text-[13px] text-ink-soft">来源：<span className="font-medium text-ink">{item.sourceName}</span></div>
        <a href={getContentLink(item)} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50">
          阅读原文<ArrowUpRight size={13} />
        </a>
      </div>
      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">摘要</h2>
        <p className="text-[14.5px] leading-relaxed text-ink">
          {item.bodyZh?.trim() ? summarizeForHome(item.bodyZh, 600) : summarizeForHome(getHomeSummary(item), 600)}
        </p>
      </section>
      {heatPoints.length > 1 && (
        <section className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Flame size={13} className="text-risk" />热度趋势
          </div>
          <HeatChart points={heatPoints} />
        </section>
      )}
      {(item.sourceRefs?.length || 0) > 0 && (
        <section className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
          <h2 className="mb-3 text-[13px] font-semibold text-ink">其他相关报道</h2>
          <div className="space-y-2">
            {item.sourceRefs!.map((ref) => (
              <a key={`${ref.sourceName}-${ref.sourceUrl}`} href={ref.sourceUrl} target="_blank" rel="noreferrer"
                className="block rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-brand-line">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                  <span>{ref.sourceName}</span>
                  {ref.publishedAt && <time className="font-mono">{ref.publishedAt}</time>}
                  <ArrowUpRight size={11} className="ml-auto" />
                </div>
                {ref.title && <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{ref.title}</p>}
              </a>
            ))}
          </div>
        </section>
      )}
      <section className="mb-8 rounded-lg bg-paper px-5 py-4">
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">ESG 议题（SASB）</div>
        <span className="inline-block rounded-md border border-brand-line bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand-deep">
          {item.esgTopic}
        </span>
      </section>
      {item.recommended && (getRecommendReason(item) || getRecommendBullets(item).length > 0) && (
        <section className="rounded-lg border border-dashed border-brand-line bg-brand-soft/50 px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
            <Star size={14} className="fill-brand text-brand" />推荐理由
          </div>
          {getRecommendReason(item) && (
            <p className="mb-3 text-[14px] leading-relaxed font-medium text-ink">{getRecommendReason(item)}</p>
          )}
          <ul className="space-y-1.5">
            {getRecommendBullets(item).map((b) => (
              <li key={b} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(() => { return item.impactAnalysis ? <ImpactCard analysis={item.impactAnalysis} /> : null; })()}

      {/* Zone affiliation */}
      {(() => {
        const zoneMap = new Map([...getZonesByEventId(item.id), ...getZonesForContent(item)].map((z) => [z.id, z]));
        const zones = Array.from(zoneMap.values());
        return zones.length > 0 ? (
        <section className="rounded-lg border border-dashed border-brand-line bg-brand-soft px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
            <BookOpen size={14} />所属专区
          </div>
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <Link key={z.id} href={`/zones/${z.id}`}
                className="inline-flex items-center gap-1 rounded-md bg-surface px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50">
                {z.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null; })()}
      {/* Related regulations derived from real content */}
      {(() => {
        var relatedRegs = getRegulationsForEvent(item);
        if (relatedRegs.length === 0) return null;
        return (
          <section className="rounded-lg border border-line bg-surface px-5 py-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <BookOpen size={14} className="text-brand-deep" />
              相关法规与标准
              <span className="ml-1.5 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-deep">{relatedRegs.length}</span>
            </h2>
            <div className="space-y-3">
              {relatedRegs.map(function (reg) {
                return (
                  <div key={reg.id} className="rounded-lg border border-line bg-paper p-4 transition-colors hover:border-line-strong">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-info-soft px-1.5 py-0.5 text-[10px] font-medium text-info">{reg.contentType}</span>
                      <span className="text-[11px] text-ink-faint">{reg.sourceName}</span>
                      <time className="ml-auto font-mono text-[10px] text-ink-faint">{reg.publishedAt}</time>
                    </div>
                    <h3 className="mb-1 text-[13px] font-semibold text-ink">{getHomeTitle(reg)}</h3>
                    <p className="mb-2 text-[12px] leading-relaxed text-ink-soft">{getHomeSummary(reg)}</p>
                    <a href={getContentLink(reg)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-deep hover:underline">
                      阅读原文 <ArrowUpRight size={11} />
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}



    </article>
  );
}
