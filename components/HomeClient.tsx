"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star, ChevronDown, CalendarRange, RotateCcw, Flame, Clock } from "lucide-react";
import { getContentLink, getHomeTitle, getHomeSummary, summarizeForHome, type ContentItem, type ContentType } from "@/lib/esg-data-client";
import { getRecommendReason } from "@/lib/recommendation";
import type { Zone } from "@/lib/zones-data";
import type { HeatHistory, StoryCluster } from "@/lib/contracts/pipeline";
import HeatSparkline from "@/components/HeatSparkline";

type Tab = "全部" | "政策" | "行业" | "观点" | "学术" | "评级";
var TABS: Tab[] = ["全部", "政策", "行业", "观点", "学术", "评级"];
var TAB_TYPE: Record<string, ContentType> = { 政策: "政策", 行业: "行业", 观点: "观点", 学术: "学术", 评级: "评级" };

var TYPE_COLORS: Record<string, string> = {
  政策: "bg-info-soft text-info", 行业: "bg-brand-soft text-brand-deep",
  观点: "bg-violet-soft text-violet-note", 学术: "bg-calm-soft text-calm", 评级: "bg-paper text-ink-soft",
};

function formatCount(n: number | undefined | null) {
  if (n == null || n <= 0) return "";
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "亿";
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function academicRank(c: ContentItem) {
  var score = Number(c.academicScore ?? -1);
  if (c.recommended) score += 100;
  if (c.importanceLevel === "高") score += 10;
  else if (c.importanceLevel === "中") score += 5;
  return score;
}

function shortJournal(name?: string) {
  if (!name) return "";
  return name.length > 24 ? name.slice(0, 23) + "…" : name;
}

function totalSourceCount(item: ContentItem) {
  return new Set([item.sourceName, ...(item.sourceRefs || []).map(function (ref) { return ref.sourceName; })].filter(Boolean)).size;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function formatEventTime(value: string) {
  if (!/[T\s]/.test(value)) return "";
  var d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function weekdayLabel(date: string) {
  var d = new Date(date + "T00:00:00+08:00");
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", weekday: "short" }).format(d);
}

function relativeDay(date: string) {
  var now = new Date();
  var formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  var today = formatter.format(now);
  var diff = Math.round((Date.parse(today + "T00:00:00+08:00") - Date.parse(date + "T00:00:00+08:00")) / 86_400_000);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return "";
}

interface Props { contents: ContentItem[]; zones: Zone[]; initialMonth?: string; hotspots?: StoryCluster[]; heatHistory?: HeatHistory | null }

export default function HomeClient({ contents, zones, initialMonth, hotspots, heatHistory }: Props) {
  // 返回首页时恢复离开前的滚动位置，避免每次都回到顶部。
  useEffect(function () {
    var key = "esg-home-scroll-y";
    var saved = Number(sessionStorage.getItem(key));
    if (Number.isFinite(saved) && saved > 0) {
      window.scrollTo(0, saved);
    }
    sessionStorage.removeItem(key);

    var timer: ReturnType<typeof setTimeout> | undefined;
    function onScroll() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        sessionStorage.setItem(key, String(window.scrollY));
      }, 120);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return function () {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  var [tab, setTab] = useState<Tab>("全部");
  var [showAll, setShowAll] = useState(false);
  var [pickedOnly, setPickedOnly] = useState(false);
  var [month, setMonth] = useState(initialMonth && /^\d{4}-\d{2}$/.test(initialMonth) ? initialMonth : "");
  var CUTOFF = 20;

  var hotspotIds = useMemo(function () {
    return [...new Set((hotspots || []).flatMap(function (story) { return story.memberIds; }))];
  }, [hotspots]);

  var months = useMemo(function () {
    return Array.from(new Set(contents.map(function (c) { return c.publishedAt.slice(0, 7); }))).sort().reverse();
  }, [contents]);

  var visible = useMemo(function () {
    var t = TAB_TYPE[tab];
    var pool = t ? contents.filter(function (c) { return c.contentType === t; }) : contents;
    if (month) pool = pool.filter(function (c) { return c.publishedAt.slice(0, 7) === month; });
    return pool.slice().sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); });
  }, [tab, contents, month]);

  var filtered = useMemo(function () {
    return pickedOnly ? visible.filter(function (c) { return c.recommended; }) : visible;
  }, [visible, pickedOnly]);

  var cappedPool = useMemo(function () {
    var pool = filtered.filter(function (c) { return c.academicExcluded !== true; });
    if (tab !== "全部") return pool;
    var byDate: Record<string, ContentItem[]> = {};
    pool.forEach(function (item) {
      var key = dateKey(item.publishedAt);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(item);
    });
    return Object.values(byDate).flatMap(function (items) {
      var acad = items.filter(function (c) { return c.contentType === "学术"; });
      if (acad.length <= 2) return items;
      var others = items.filter(function (c) { return c.contentType !== "学术"; });
      return others.concat(acad.sort(function (a, b) { return academicRank(b) - academicRank(a); }).slice(0, 2));
    });
  }, [filtered, tab]);

  var allGroups = useMemo(function () {
    var map: Record<string, ContentItem[]> = {};
    cappedPool.forEach(function (item) {
      var key = dateKey(item.publishedAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort(function (a, b) { return b[0].localeCompare(a[0]); });
  }, [cappedPool]);

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

  function applyMonth(value: string) {
    setMonth(value);
    setShowAll(false);
    window.history.replaceState(null, "", value ? "/?month=" + value : "/");
  }

  function backToLatest() {
    setMonth("");
    setShowAll(false);
    setPickedOnly(false);
    setTab("全部");
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* Hot strip */}
      <section className="rounded-lg border border-line bg-surface">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-[12px] font-semibold text-ink">
          <Flame size={13} className="text-risk" />当前热点
          <span className="ml-auto text-[11px] font-normal text-ink-faint">48 小时窗口 · 独立来源去重</span>
        </div>
        {hotspots && hotspots.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotspots.map(function (story, index) {
              var heatDisplay = Math.round((story.heat || 0) * 10);
              var trend = story.trend || "unknown";
              var trendLabel = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "new" ? "新" : "→";
              var trendClass = trend === "up" ? "text-calm" : trend === "down" ? "text-risk" : trend === "new" ? "text-brand-deep" : "text-ink-faint";
              var badges = story.badges || [];
              var badgeLabel = badges.includes("surge") ? "爆发" : badges.includes("rising") ? "上升" : badges.includes("new") ? "新" : "";
              var sources = (story.sourceNames || []).slice(0, 3).join(" / ");
              return (
                <Link key={story.id} href={"/events/" + story.rootId} className="group rounded-md border border-line bg-paper p-3 transition-colors hover:border-brand-line hover:bg-brand-soft/30">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-mono font-semibold text-risk">#{index + 1}</span>
                    <span className="font-mono text-ink-soft">热度 {heatDisplay}</span>
                    <span className={"font-semibold " + trendClass}>{trendLabel}</span>
                    {badgeLabel && <span className="rounded bg-warn-soft px-1 py-0.5 text-[10px] text-warn">{badgeLabel}</span>}
                    <span className="ml-auto text-ink-faint">{story.participants.length} 家来源</span>
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink group-hover:text-brand-deep">{story.title}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{story.digest || story.latest}</p>
                  {sources && <p className="mt-1.5 truncate text-[10px] text-ink-faint">{sources}</p>}
                  {heatHistory?.stories[story.id] && (
                    <HeatSparkline points={heatHistory.stories[story.id]} className="mt-2 h-8 w-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-4 text-[12px] text-ink-faint">暂无跨来源热点，待多个独立信源在同一窗口覆盖同一事件后自动出现。</div>
        )}
      </section>

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
        <select value={month} onChange={function (e) { applyMonth(e.target.value); }} aria-label="按月份筛选"
          className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink-soft outline-none focus:border-brand-line">
          <option value="">全部月份</option>
          {months.map(function (m) { return <option key={m} value={m}>{m}</option>; })}
        </select>
        <button onClick={backToLatest} title="回到最新"
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep">
          <RotateCcw size={12} />回到最新
        </button>
      </div>

      {empty ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
          {month ? "该月份暂无内容" : "该分类下暂无内容"}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-1 h-[calc(100%-8px)] w-px bg-line-strong" aria-hidden />
          <div className="space-y-8">
            {displayGroups.map(function (_a) {
              var date = _a[0], items = _a[1], multi = items.length > 1;
              return (
                <div key={date} className="relative">
                  <div className="flex items-start">
                    <div className="sticky top-14 z-10 flex shrink-0 items-center pt-[2px]">
                      <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand bg-surface">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                      </div>
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="sticky top-14 z-10 mb-3 flex items-center gap-2 rounded-md bg-paper/95 px-2 py-1 backdrop-blur">
                        <time className="font-mono text-[11px] font-semibold tracking-wider text-brand-deep">
                          {date} {weekdayLabel(date)}
                        </time>
                        {relativeDay(date) && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-deep">{relativeDay(date)}</span>}
                        {multi && <span className="text-[11px] text-ink-faint">{items.length} 条</span>}
                      </div>
                      <div className="rounded-lg border border-line bg-surface overflow-hidden">
                        {items.map(function (item, idx2) {
                          var itemZones = zones.filter(function (z) { return z.eventIds.includes(item.id); }), isLast = idx2 === items.length - 1;
                          return (
                            <Link key={item.id} href={"/events/" + item.id}
                              className={"group relative block p-5 transition-all hover:bg-brand-soft/30 " + (isLast ? "" : "border-b border-line/50")}>
                              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                                <span className={"rounded px-1.5 py-0.5 " + (TYPE_COLORS[item.contentType] || "bg-paper text-ink-soft")}>{item.contentType}</span>
                                {formatEventTime(item.publishedAt) && (
                                  <time className="inline-flex items-center gap-0.5 rounded bg-paper px-1.5 py-0.5 font-mono text-ink-soft" title={"发布于 " + item.publishedAt}>
                                    <Clock size={10} />{formatEventTime(item.publishedAt)}
                                  </time>
                                )}
                                {item.recommended && <span className="inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-surface"><Star size={9} className="fill-surface" />精选</span>}
                                {hotspotIds?.includes(item.id) && <span className="inline-flex items-center gap-0.5 rounded bg-risk-soft px-1.5 py-0.5 text-risk"><Flame size={9} />热点跟踪中</span>}
                                {totalSourceCount(item) > 1 && <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{totalSourceCount(item)} 家独立来源</span>}
                                {item.region && <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={10} />{item.region}</span>}
                                <span onClick={function(e) { e.stopPropagation(); window.open(getContentLink(item), '_blank', 'noopener,noreferrer'); }}
                                  className="ml-auto cursor-pointer rounded p-1 text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep"
                                  title={"查看原文：" + item.sourceName}><ArrowUpRight size={13} /></span>
                              </div>
                              <div className="mb-3 flex items-start gap-4">
                                <div className="min-w-0 flex-1">
                                  <h2 className="mb-1.5 text-[15px] leading-snug font-semibold text-ink group-hover:text-brand-deep">{getHomeTitle(item)}</h2>
                                  <p className="line-clamp-5 text-[13px] leading-relaxed text-ink-soft">{summarizeForHome(getHomeSummary(item), 300)}</p>
                                </div>
                              </div>
{item.recommended && getRecommendReason(item) && (
                                <div className="mb-3 rounded border border-dashed border-brand-line bg-brand-soft/50 px-3 py-2">
                                  <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-brand-deep"><Star size={10} className="fill-brand text-brand" />推荐理由</div>
                                  {getRecommendReason(item) && <p className="line-clamp-2 text-[12px] font-medium leading-relaxed text-ink">{getRecommendReason(item)}</p>}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-soft">{item.esgTopic}</span>
                                {item.contentType === "学术" && item.journalName && (
                                  <span className="rounded border border-violet-note/30 bg-violet-soft px-2 py-0.5 text-[10px] text-violet-note" title={item.journalName}>{shortJournal(item.journalName)}</span>
                                )}
                                {item.contentType === "学术" && Number(item.citationCount) > 0 && (
                                  <span className="rounded border border-violet-note/30 bg-violet-soft px-2 py-0.5 font-mono text-[10px] text-violet-note">引用 {formatCount(item.citationCount)}</span>
                                )}
                                {itemZones.map(function (z) {
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
