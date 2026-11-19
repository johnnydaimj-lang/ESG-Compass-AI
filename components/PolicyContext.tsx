import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ResolvedPolicyContext } from "@/lib/policy-context";
import { sourceKey } from "@/lib/policy-context";
import { publicationDate } from "@/lib/event-progress";
import { getContentLink, getHomeTitle, type ContentItem } from "@/lib/contracts/content";

export function PolicySource({ policy, item }: { policy: ResolvedPolicyContext; item: ContentItem }) {
  const document = policy.document;
  const sameSource = sourceKey(document.url) === sourceKey(getContentLink(item));
  return <div className="mb-8 rounded-lg border border-brand-line bg-surface p-5">
    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
      <span className="font-semibold text-brand-deep">发布机构原文</span>
      <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{document.kind}</span>
      {document.documentNumber && <span className="text-ink-faint">{document.documentNumber}</span>}
    </div>
    <p className="text-[13px] font-medium text-ink">{policy.issuer}</p>
    <a href={document.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] leading-relaxed text-brand-deep hover:underline">
      {document.title}<ArrowUpRight size={13} className="shrink-0" />
    </a>
    <p className="mt-2 text-[11px] text-ink-faint">原文发布 <time dateTime={document.publishedOn}>{document.publishedOn}</time> · 核验 {document.verifiedOn}</p>
    {!sameSource && <p className="mt-3 border-t border-line pt-3 text-[12px] text-ink-soft">本条快讯来源：
      <a href={getContentLink(item)} target="_blank" rel="noreferrer" className="text-brand-deep hover:underline">{item.sourceName} ↗</a>
    </p>}
  </div>;
}

function Insight({ insight, currentId }: { insight: ResolvedPolicyContext["insights"][number]; currentId: string }) {
  return <article className="py-4">
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
      <span>{insight.content.sourceName}</span>
      <time dateTime={insight.content.publishedAt}>{publicationDate(insight.content.publishedAt)}</time>
      {insight.contentId === currentId && <span>本条快讯来源的解读</span>}
    </div>
    <h3 className="mt-1 text-[14px] font-medium leading-snug text-ink">{getHomeTitle(insight.content)}</h3>
    <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{insight.authors.length ? `作者：${insight.authors.join("、")}` : "机构署名"}</p>
    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{insight.angle}</p>
    <div className="mt-2 flex flex-wrap gap-4 text-[12px] font-medium text-brand-deep">
      <a href={getContentLink(insight.content)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">阅读解读<ArrowUpRight size={12} /></a>
      {insight.contentId !== currentId && <Link href={`/events/${encodeURIComponent(insight.contentId)}`} className="hover:underline">查看快讯</Link>}
    </div>
  </article>;
}

export function PolicyInsights({ policy, currentId }: { policy: ResolvedPolicyContext; currentId: string }) {
  if (!policy.insights.length) return null;
  return <section aria-labelledby="policy-insights-title" className="my-8 rounded-lg border border-line bg-surface px-5 pt-5">
    <h2 id="policy-insights-title" className="text-[14px] font-semibold text-ink">相关解读与洞察</h2>
    <p className="mt-1 text-[11px] text-ink-faint">针对上述政策的外部分析，不代表发布机构立场。</p>
    <div className="divide-y divide-line">{policy.insights.slice(0, 3).map((insight) => <Insight key={insight.contentId} insight={insight} currentId={currentId} />)}</div>
    {policy.insights.length > 3 && <details className="border-t border-line py-4">
      <summary className="cursor-pointer text-[12px] font-medium text-brand-deep">更多解读 · {policy.insights.length - 3}</summary>
      <div className="divide-y divide-line">{policy.insights.slice(3).map((insight) => <Insight key={insight.contentId} insight={insight} currentId={currentId} />)}</div>
    </details>}
  </section>;
}
