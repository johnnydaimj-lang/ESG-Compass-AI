import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ResolvedProgress } from "@/lib/event-progress";
import { publicationDate } from "@/lib/event-progress";
import { getContentLink, getHomeTitle } from "@/lib/contracts/content";

function Entry({ entry, currentId }: { entry: ResolvedProgress["entries"][number]; currentId: string }) {
  return (
    <li className="border-l-2 border-brand-line pl-4">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
        <time dateTime={entry.date}>{entry.date}</time><span>{entry.dateLabel}</span>
        <span className="font-medium text-brand-deep">{entry.stage}</span>
        {entry.contentId === currentId && <span>本条快讯</span>}
      </div>
      <p className="text-[13px] leading-relaxed text-ink">{entry.change}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-brand-deep">
        <a href={getContentLink(entry.content)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
          {entry.content.sourceName}<ArrowUpRight size={12} />
        </a>
        {entry.contentId !== currentId && <Link href={`/events/${encodeURIComponent(entry.contentId)}`} className="hover:underline">查看当时快讯：{getHomeTitle(entry.content)}</Link>}
      </div>
    </li>
  );
}

export default function EventProgress({ matter, currentId }: { matter: ResolvedProgress; currentId: string }) {
  const latest = matter.entries[0];
  return (
    <section id="event-progress" aria-labelledby="event-progress-title" className="mb-8 scroll-mt-24 rounded-lg border border-brand-line bg-surface p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 id="event-progress-title" className="text-[14px] font-semibold text-ink">事项进展</h2>
        <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] text-brand-deep">{latest.stage}</span>
      </div>
      <p className="text-[13px] font-medium text-ink">{matter.title} · {matter.region}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{latest.change}</p>
      <p className="mt-2 text-[11px] text-ink-faint">截至收录报道 {publicationDate(latest.content.publishedAt)}，不代表完整事项历史。</p>
      {matter.selfChecks.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="mb-2 text-[12px] font-semibold text-ink">企业可以检查什么</h3>
          {matter.selfChecks.map((check) => <p key={check} className="text-[13px] leading-relaxed text-ink-soft">{check}</p>)}
        </div>
      )}
      {matter.entries.length > 1 ? (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-3 text-[12px] font-semibold text-ink">进展记录 · {matter.entries.length}</h3>
          <ol className="space-y-5">{matter.entries.slice(0, 3).map((entry) => <Entry key={entry.id} entry={entry} currentId={currentId} />)}</ol>
          {matter.entries.length > 3 && <details className="mt-4">
            <summary className="cursor-pointer text-[12px] font-medium text-brand-deep">展开更早 {matter.entries.length - 3} 条进展</summary>
            <ol className="mt-4 space-y-5">{matter.entries.slice(3).map((entry) => <Entry key={entry.id} entry={entry} currentId={currentId} />)}</ol>
          </details>}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-ink-faint">已收录 1 项进展 · {latest.dateLabel} {latest.date} · 依据：
          <a href={getContentLink(latest.content)} target="_blank" rel="noreferrer" className="text-brand-deep hover:underline">{latest.content.sourceName}</a>
        </p>
      )}
    </section>
  );
}
