import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, BookOpen, Star } from "lucide-react";
import { getAllContents, getContentById, getContentLink } from "@/lib/esg-data";
import { getZonesByEventId } from "@/lib/zones-data";
import { getRelatedKnowledge } from "@/lib/knowledge-base";
import ImpactCard from "@/components/ImpactCard";

interface Props { params: Promise<{ id: string }> }
export function generateStaticParams() { return getAllContents().map((c) => ({ id: c.id })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; const item = getContentById(id);
  return { title: item ? item.title : "事件详情" }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params; const item = getContentById(id);
  if (!item) notFound();
  return (
    <article className="mx-auto max-w-3xl pb-16">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />返回ESG快讯
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{item.contentType}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{item.region}</span>
        <time className="font-mono text-ink-faint">{item.publishedAt}</time>
      </div>
      <h1 className="mb-6 text-2xl leading-snug font-semibold tracking-tight text-ink">{item.title}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="text-[13px] text-ink-soft">来源：<span className="font-medium text-ink">{item.sourceName}</span></div>
        <a href={getContentLink(item)} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50">
          阅读原文<ArrowUpRight size={13} />
        </a>
      </div>
      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">摘要</h2>
        <p className="text-[14.5px] leading-relaxed text-ink">{item.summary}</p>
      </section>
      <section className="mb-8 rounded-lg bg-paper px-5 py-4">
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">ESG 议题（SASB）</div>
        <span className="inline-block rounded-md border border-brand-line bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand-deep">
          {item.esgTopic}
        </span>
      </section>
      {item.recommended && item.whyMatters && (
        <section className="rounded-lg border border-dashed border-brand-line bg-brand-soft/50 px-5 py-4">



          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
            <Star size={14} className="fill-brand text-brand" />推荐理由
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">{item.whyMatters}</p>
        </section>
      )}

      {item.riskPrompts && item.riskPrompts.length > 0 && (
        <section className="my-4 rounded-lg border border-warn/30 bg-warn-soft/50 px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-warn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            风险提示
          </div>
          <ul className="space-y-2">
            {item.riskPrompts.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-warn" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}
      {(() => { return item.impactAnalysis ? <ImpactCard analysis={item.impactAnalysis} /> : null; })()}

      {/* Zone affiliation */}
      {(() => { const zones = getZonesByEventId(item.id); return zones.length > 0 ? (
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
      {/* Related KB content */}
      {(() => {
        var relatedKb = getRelatedKnowledge(item.id);
        if (relatedKb.length === 0) return null;
        return (
          <section className="rounded-lg border border-line bg-surface px-5 py-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-deep"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              相关法规与标准
            </h2>
            <div className="space-y-3">
              {relatedKb.map(function (kb) {
                var catColor = "";
                if (kb.category === "法规") catColor = "bg-info-soft text-info";
                else if (kb.category === "标准") catColor = "bg-violet-soft text-violet-note";
                else if (kb.category === "解读") catColor = "bg-calm-soft text-calm";
                else catColor = "bg-paper text-ink-soft";
                return (
                  <div key={kb.id} className="rounded-lg border border-line bg-paper p-4 transition-colors hover:border-line-strong">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={"rounded px-1.5 py-0.5 text-[10px] font-medium " + catColor}>{kb.category}</span>
                      <span className="text-[11px] text-ink-faint">{kb.sourceName}</span>
                    </div>
                    <h3 className="mb-1 text-[13px] font-semibold text-ink">{kb.title}</h3>
                    <p className="mb-2 text-[12px] leading-relaxed text-ink-soft">{kb.summary}</p>
                    <a href={kb.sourceUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-deep hover:underline">
                      阅读原文
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
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