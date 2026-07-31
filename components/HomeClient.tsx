"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star, ChevronDown } from "lucide-react";
import { getContentLink, type ContentItem, type ContentType } from "@/lib/esg-data-client";
import { getZonesByEventId } from "@/lib/zones-data";

type Tab = "全部" | "政策" | "专家观点" | "学术" | "评级";
var TABS: Tab[] = ["全部", "政策", "专家观点", "学术", "评级"];
var TAB_TYPE: Record<string, ContentType> = { 政策: "ESG 政策", 专家观点: "专家观点", 学术: "学术文章", 评级: "评级动态" };

var TYPE_COLORS: Record<string, string> = {
  "ESG 政策": "bg-info-soft text-info", 专家观点: "bg-violet-soft text-violet-note",
  学术文章: "bg-calm-soft text-calm", 评级动态: "bg-paper text-ink-soft",
};

interface Props { contents: ContentItem[] }

export default function HomeClient({ contents }: Props) {
  var [tab, setTab] = useState<Tab>("全部");
  var [showAll, setShowAll] = useState(false);
  var [pickedOnly, setPickedOnly] = useState(false);
  var CUTOFF = 20;

  var visible = useMemo(function () {
    var t = TAB_TYPE[tab];
    var pool = t ? contents.filter(function (c) { return c.contentType === t; }) : contents;
    return pool.slice().sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); });
  }, [tab, contents]);

  var filtered = useMemo(function () {
    return pickedOnly ? visible.filter(function (c) { return c.recommended; }) : visible;
  }, [visible, pickedOnly]);

  var allGroups = useMemo(function () {
    var map: Record<string, ContentItem[]> = {};
    filtered.forEach(function (item) {
      if (!map[item.publishedAt]) map[item.publishedAt] = [];
      map[item.publishedAt].push(item);
    });
    return Object.entries(map).sort(function (a, b) { return b[0].localeCompare(a[0]); });
  }, [filtered]);

  var displayGroups = useMemo(function () {
    if (showAll) return allGroups;
    var count = 0, result: [string, ContentItem[]][] = [];
    for (var i = 0; i < allGroups.length; i++) {
      if (count >= CUTOFF) break;
      result.push(allGroups[i]);
      count += allGroups[i][1].length;
    }
    return result;
  }, [allGroups, showAll]);

  var totalItems = allGroups.reduce(function (s, g) { return s + g[1].length; }, 0);
  var displayedItems = displayGroups.reduce(function (s, g) { return s + g[1].length; }, 0);
  var hiddenItems = totalItems - displayedItems;
  var hasMore = hiddenItems > 0;
  var empty = allGroups.length === 0;

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* Tabs + Curated toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1 scrollbar-thin">
          {TABS.map(function (t) {
            return (
              <button key={t} onClick={function () { setTab(t); setShowAll(false); }}
                className={"shrink-0 rounded-md px-3 py-1.5 text-[12.5px] transition-colors " + (tab === t ? "bg-brand font-medium text-surface" : "text-ink-soft hover:text-ink")}>
                {t}
              </button>
            );
          })}
        </div>
        <div className="h-5 w-px bg-line" aria-hidden />
        <button onClick={function () { setPickedOnly(function (v) { return !v; }); setShowAll(false); }}
          className={"inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors " + (pickedOnly
            ? "border-brand-line bg-brand-soft text-brand-deep"
            : "border-line text-ink-soft hover:border-line-strong hover:text-ink")}>
          <Star size={13} className={pickedOnly ? "fill-brand text-brand" : ""} />
          {pickedOnly ? "精选" : "只看精选"}
        </button>
      </div>

      {empty ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">该分类下暂无内容</div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-1 h-[calc(100%-8px)] w-px bg-line-strong" aria-hidden />
          <div className="space-y-8">
            {displayGroups.map(function (_a) {
              var date = _a[0], items = _a[1], multi = items.length > 1;
              return (
                <div key={date} className="relative">
                  <div className="flex items-start">
                    <div className="relative flex shrink-0 items-center pt-[2px]">
                      <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand bg-surface">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                      </div>
                      <div className="absolute left-3 top-3 h-px w-4 bg-line-strong" />
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="mb-3 flex items-center gap-2">
                        <time className="font-mono text-[11px] font-semibold tracking-wider text-brand-deep">{date}</time>
                        {multi && <span className="text-[11px] text-ink-faint">{items.length} 条</span>}
                      </div>
                      <div className="rounded-lg border border-line bg-surface overflow-hidden">
                        {items.map(function (item, idx2) {
                          var zones = getZonesByEventId(item.id), isLast = idx2 === items.length - 1;
                          return (
                            <Link key={item.id} href={"/events/" + item.id}
                              className={"group relative block p-5 transition-all hover:bg-brand-soft/30 " + (isLast ? "" : "border-b border-line/50")}>
                              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                                <span className={"rounded px-1.5 py-0.5 " + (TYPE_COLORS[item.contentType] || "bg-paper text-ink-soft")}>{item.contentType}</span>
                                {item.recommended && <span className="inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-surface"><Star size={9} className="fill-surface" />精选</span>}
                                {item.region && <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={10} />{item.region}</span>}
                                <span onClick={function(e) { e.stopPropagation(); window.open(getContentLink(item), '_blank', 'noopener,noreferrer'); }}
                                  className="ml-auto cursor-pointer rounded p-1 text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep"
                                  title={"查看原文：" + item.sourceName}><ArrowUpRight size={13} /></span>
                              </div>
                              <h2 className="mb-1.5 text-[15px] leading-snug font-semibold text-ink group-hover:text-brand-deep">{item.title}</h2>
                              <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{item.summary}</p>
                              {item.recommended && item.whyMatters && (
                                <div className="mb-3 rounded border border-dashed border-brand-line bg-brand-soft/50 px-3 py-2">
                                  <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-brand-deep"><Star size={10} className="fill-brand text-brand" />推荐理由</div>
                                  <p className="text-[12px] leading-relaxed text-ink-soft">{item.whyMatters}</p>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-soft">{item.esgTopic}</span>
                                {zones.map(function (z) {
                                  return <span key={z.id} className="inline-flex items-center gap-0.5 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-deep">{z.name}</span>;
                                })}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="mt-6 text-center">
              <button onClick={function () { setShowAll(true); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep hover:shadow-sm">
                <ChevronDown size={14} />展示更多（{hiddenItems} 条）
              </button>
            </div>
          )}
          <div className="mt-4 text-center text-[11px] text-ink-faint">共 {totalItems} 条 · 显示 {displayedItems} 条</div>
        </div>
      )}
    </div>
  );
}
