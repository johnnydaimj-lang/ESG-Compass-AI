"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { ContentItem, ContentType } from "@/lib/esg-data";
import { getZonesByEventId } from "@/lib/zones-data";

type Tab = "全部" | "政策" | "专家观点" | "学术" | "评级";
const TABS: Tab[] = ["全部", "政策", "专家观点", "学术", "评级"];
const TAB_TYPE: Partial<Record<Tab, ContentType>> = { 政策: "ESG 政策", 专家观点: "专家观点", 学术: "学术文章", 评级: "评级动态" };

const TYPE_STYLES: Record<ContentType, string> = {
  "ESG 政策": "bg-info-soft text-info", 专家观点: "bg-violet-soft text-violet-note",
  学术文章: "bg-calm-soft text-calm", 评级动态: "bg-paper text-ink-soft",
};

interface Props { contents: ContentItem[] }

export default function HomeClient({ contents }: Props) {
  const [tab, setTab] = useState<Tab>("全部");
  const visible = useMemo(() => {
    const type = TAB_TYPE[tab];
    const pool = type ? contents.filter((c) => c.contentType === type) : contents;
    return pool.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [tab, contents]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    visible.forEach((item) => {
      if (!groups[item.publishedAt]) groups[item.publishedAt] = [];
      groups[item.publishedAt].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [visible]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">今日重点</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          汇总当下全球 ESG 政策、专家解读、学术研究与评级动态，按时间由近到远排列，点击卡片查看详情与所属 ESG 议题。
        </p>
      </section>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1 scrollbar-thin">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
              tab === t ? "bg-brand font-medium text-surface" : "text-ink-soft hover:text-ink"
            }`}>{t}</button>
        ))}
      </div>

      {/* Timeline */}
      {grouped.length > 0 ? (
        <div className="relative">
          {grouped.map(([date, items]) => (
            <div key={date} className="mb-10 last:mb-0">
              {/* Date divider */}
              <div className="relative mb-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-line-strong" />
                <time dateTime={date} className="shrink-0 text-[11px] font-mono font-medium tracking-wide text-ink-faint">{date}</time>
                <div className="h-px flex-1 bg-line-strong" />
              </div>

              {/* Events for this date */}
              <div className="space-y-4 pl-10">
                {items.map((item) => {
                  const zones = getZonesByEventId(item.id);
                  return (
                    <Link key={item.id} href={`/events/${item.id}`}
                      className="group block rounded-lg border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-md">
                      {/* Badges row */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                        <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg bg-brand" aria-hidden />
                        <span className={`rounded px-1.5 py-0.5 ${TYPE_STYLES[item.contentType]}`}>{item.contentType}</span>
                        {item.recommended && <span className="rounded bg-brand px-1.5 py-0.5 text-surface">精选</span>}
                        <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{item.region}</span>
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto rounded p-1 text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep"
                          title={`查看原文：${item.sourceName}`}>
                          <ArrowUpRight size={13} />
                        </a>
                      </div>

                      {/* Title */}
                      <h2 className="mb-1.5 text-[15px] leading-snug font-semibold text-ink group-hover:text-brand-deep">{item.title}</h2>

                      {/* Summary */}
                      <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{item.summary}</p>
                      {item.recommended && item.whyMatters && (
                        <div className="rounded border border-dashed border-brand-line bg-brand-soft/50 px-3 py-2">
                          <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-brand-deep">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            推荐理由
                          </div>
                          <p className="text-[12px] leading-relaxed text-ink-soft">{item.whyMatters}</p>
                        </div>
                      )}

                      {/* Footer: ESG topic + zone badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-soft">{item.esgTopic}</span>
                        {zones.map((z) => (
                          <span key={z.id} className="inline-flex items-center gap-0.5 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-deep">
                            {z.name}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
          该分类下暂无内容
        </div>
      )}
    </div>
  );
}
