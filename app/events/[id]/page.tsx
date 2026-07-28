import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { getAllContents, getContentById } from "@/lib/esg-data";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllContents().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getContentById(id);
  return { title: item ? item.title : "事件详情" };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const item = getContentById(id);
  if (!item) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep"
      >
        <ArrowLeft size={14} />
        返回今日重点
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{item.importanceLevel}</span>
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{item.contentType}</span>
        <span className="inline-flex items-center gap-1 text-ink-faint">
          <MapPin size={11} />
          {item.region}
        </span>
        <time className="font-mono text-ink-faint">{item.publishedAt}</time>
      </div>

      <h1 className="mb-6 text-2xl leading-snug font-semibold tracking-tight text-ink">{item.title}</h1>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="text-[13px] text-ink-soft">
          来源：<span className="font-medium text-ink">{item.sourceName}</span>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50"
        >
          阅读原文
          <ArrowUpRight size={13} />
        </a>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">摘要</h2>
        <p className="text-[14.5px] leading-relaxed text-ink">{item.summary}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">
          对企业的影响
        </h2>
        <p className="text-[14.5px] leading-relaxed text-ink">{item.businessImpact}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">判定依据</h2>
        <p className="text-[14.5px] leading-relaxed text-ink">{item.whyImportant}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-faint uppercase">建议动作</h2>
        <ol className="space-y-2.5">
          {item.actions.map((action, index) => (
            <li key={index} className="flex gap-3 text-[14px] leading-relaxed text-ink">
              <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded bg-brand-soft font-mono text-[11px] font-medium text-brand-deep">
                {index + 1}
              </span>
              {action}
            </li>
          ))}
        </ol>
      </section>

      {(item.riskTags.length > 0 || item.topicTags.length > 0) && (
        <section className="flex flex-wrap gap-1.5 border-t border-line pt-6">
          {item.riskTags.map((tag) => (
            <span key={tag} className="rounded bg-risk-soft px-2 py-0.5 text-[11.5px] text-risk">
              {tag}
            </span>
          ))}
          {item.topicTags.map((tag) => (
            <span key={tag} className="rounded bg-paper px-2 py-0.5 text-[11.5px] text-ink-soft">
              {tag}
            </span>
          ))}
        </section>
      )}
    </article>
  );
}
