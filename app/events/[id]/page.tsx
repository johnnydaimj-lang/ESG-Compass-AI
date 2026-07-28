import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, BookOpen } from "lucide-react";
import { getAllContents, getContentById } from "@/lib/esg-data";
import { getZonesByEventId } from "@/lib/zones-data";

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
        <ArrowLeft size={14} />返回今日重点
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{item.contentType}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{item.region}</span>
        <time className="font-mono text-ink-faint">{item.publishedAt}</time>
      </div>
      <h1 className="mb-6 text-2xl leading-snug font-semibold tracking-tight text-ink">{item.title}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="text-[13px] text-ink-soft">来源：<span className="font-medium text-ink">{item.sourceName}</span></div>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50">
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

    </article>
  );
}