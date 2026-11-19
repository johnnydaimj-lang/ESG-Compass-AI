import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, BookOpen, Star, Flame } from "lucide-react";
import { getContentById, getContentLink, getHomeSummary, getHomeTitle, summarizeForHome } from "@/lib/esg-data";
import { getZonesByEventId, getZonesForContent } from "@/lib/zones-store";
import { getRecommendReason } from "@/lib/recommendation";
import { readHeatHistory } from "@/lib/publication-store";
import ImpactCard from "@/components/ImpactCard";
import HeatChart from "@/components/HeatChart";
import EventProgress from "@/components/EventProgress";
import { getProgressForEvent, getPolicyRelationsForEvent } from "@/lib/event-progress-store";
import { isFeedEligible } from "@/lib/feed-policy";
import { PolicySource, PolicyInsights } from "@/components/PolicyContext";
import { sourceKey } from "@/lib/policy-context";

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
  return { title: item && isFeedEligible(item) ? getHomeTitle(item) : "事件详情" }
}

export default async function EventDetailPage({ params }: Props) {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const item = getContentById(id);
  if (!item || !isFeedEligible(item)) notFound();
  const progress = getProgressForEvent(item.id);
  const policyRelations = getPolicyRelationsForEvent(item.id);
  const isInterpretation = policyRelations.some((relation) => relation.isInterpretation);
  const usedSources = new Set([getContentLink(item), ...policyRelations.flatMap(({ policy }) =>
    [policy.document.url, ...policy.insights.map((insight) => getContentLink(insight.content))])]
    .filter((url): url is string => !!url).map(sourceKey));
  const extraSources = (item.sourceRefs || []).filter((ref) => {
    const key = sourceKey(ref.sourceUrl);
    if (!key || usedSources.has(key)) return false;
    usedSources.add(key);
    return true;
  });
  const recommendReason = item.recommended ? getRecommendReason(item) : null;
  const heatHistory = readHeatHistory();
  const heatPoints = item.pipeline?.storyId ? heatHistory?.stories[item.pipeline.storyId] || [] : [];
  return (
    <article className="mx-auto max-w-3xl pb-16">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />返回ESG快讯
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{isInterpretation ? "政策解读" : item.contentType}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{item.region}</span>
        <time className="font-mono text-ink-faint">{formatPublishedAt(item.publishedAt)}</time>
        {typeof item.pipeline?.score === "number" && (
          <span className={"ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold " + (item.recommended ? "bg-brand-soft text-brand-deep" : "bg-paper text-ink-soft")}
            title={"综合评分（精选门槛 " + (item.pipeline.scoreThreshold ?? 75) + "）"}>
            {item.pipeline.score} 分
          </span>
        )}
      </div>
      <h1 className="mb-6 text-2xl leading-snug font-semibold tracking-tight text-ink">{getHomeTitle(item)}</h1>
      {policyRelations.length ? <div id="policy-context" className="scroll-mt-24">
        {policyRelations.slice(0, 3).map((relation) => <PolicySource key={relation.matterId} policy={relation.policy} item={item} isInterpretation={relation.isInterpretation} />)}
        {policyRelations.length > 3 && <details className="mb-8">
          <summary className="mb-3 cursor-pointer text-[12px] text-brand-deep">更多关联政策 · {policyRelations.length - 3}</summary>
          {policyRelations.slice(3).map((relation) => <PolicySource key={relation.matterId} policy={relation.policy} item={item} isInterpretation={relation.isInterpretation} />)}
        </details>}
      </div> : <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="text-[13px] text-ink-soft">来源：<span className="font-medium text-ink">{item.sourceName}</span></div>
        <a href={getContentLink(item)} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50">
          阅读来源文章<ArrowUpRight size={13} />
        </a>
      </div>}
      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">摘要</h2>
        <p className="text-[14.5px] leading-relaxed text-ink">
          {item.bodyZh?.trim() ? summarizeForHome(item.bodyZh, 600) : summarizeForHome(getHomeSummary(item), 600)}
        </p>
      </section>
      {progress && <EventProgress matter={progress} currentId={item.id} />}
      {heatPoints.length > 1 && (
        <details className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-ink">
            <Flame size={13} className="mr-1 inline text-risk" />热度趋势
          </summary>
          <HeatChart points={heatPoints} />
        </details>
      )}
      {extraSources.length > 0 && (
        <details className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-ink">补充来源 · {extraSources.length}</summary>
          <p className="mt-2 text-[11px] text-ink-faint">来源文章中的补充链接，不计为新增进展。</p>
          <div className="mt-3 space-y-2">
            {extraSources.map((ref) => (
              <a key={`${ref.sourceName}-${ref.sourceUrl}`} href={ref.sourceUrl} target="_blank" rel="noreferrer"
                className="block rounded-md border border-line bg-paper px-3 py-2 transition-colors hover:border-brand-line">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                  <span>{ref.sourceName}</span>
                  <ArrowUpRight size={11} className="ml-auto" />
                </div>
                {ref.title && <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{ref.title}</p>}
              </a>
            ))}
          </div>
        </details>
      )}
      <section className="mb-8 rounded-lg bg-paper px-5 py-4">
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">ESG 议题（SASB）</div>
        <span className="inline-block rounded-md border border-brand-line bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand-deep">
          {item.esgTopic}
        </span>
      </section>
      {recommendReason && (
        <section className="rounded-lg border border-dashed border-brand-line bg-brand-soft/50 px-5 py-4">
          <div className="flex items-start gap-2.5">
            <Star size={14} className="mt-1 shrink-0 fill-brand text-brand" aria-hidden />
            <p className="text-[14px] leading-relaxed font-medium text-ink">{recommendReason}</p>
          </div>
        </section>
      )}

      {(() => { return item.impactAnalysis ? <ImpactCard analysis={item.impactAnalysis} /> : null; })()}

      {policyRelations.map((relation) => <PolicyInsights key={relation.matterId} policy={relation.policy} currentId={item.id} isInterpretation={relation.isInterpretation} />)}

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
    </article>
  );
}
