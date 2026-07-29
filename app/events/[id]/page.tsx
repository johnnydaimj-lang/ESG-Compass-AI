import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin, BookOpen, Star } from "lucide-react";
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
      {item.recommended && item.whyMatters && (
        <section className="rounded-lg border border-dashed border-brand-line bg-brand-soft/50 px-5 py-4">
      {/* AI 问答入口 */}
      <section className="mt-8 rounded-lg border border-brand-line bg-brand-soft/50 px-5 py-5">
        <h2 className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-brand"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          对此事件有疑问？
        </h2>
        <p className="mb-3 text-[12.5px] leading-relaxed text-ink-soft">
          基于内置知识库（政策原文 / 标准框架 / 专家解读），回答你关于这条 ESG 动态的具体问题。
        </p>
        <a href={"/chat?event=" + item.id}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          问 AI 助手
        </a>
      </section>

          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
            <Star size={14} className="fill-brand text-brand" />推荐理由
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">{item.whyMatters}</p>
        </section>
      )}

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