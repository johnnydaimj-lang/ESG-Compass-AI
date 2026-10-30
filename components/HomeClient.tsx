"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarRange,
  ChevronDown,
  Clock,
  Flame,
  MapPin,
  RotateCcw,
  Search,
  Star,
  X,
} from "lucide-react";
import {
  getContentLink,
  getHomeTitle,
  getHomeSummary,
  summarizeForHome,
  type ContentItem,
  type ContentType,
} from "@/lib/esg-data-client";
import {
  CONTENT_TYPE_SLUGS,
  contentTypeFromSlug,
  queryContents,
} from "@/lib/publication-query";
import {
  buildStorySourceCounts,
  collapseByStory,
  isFeedEligible,
  storyKey,
} from "@/lib/feed-policy";
import { getRecommendReason } from "@/lib/recommendation";
import type { Zone } from "@/lib/zones-data";
import type { HeatHistory, StoryCluster } from "@/lib/contracts/pipeline";
import HeatSparkline from "@/components/HeatSparkline";

export interface InitialHomeFilters {
  query: string;
  type?: ContentType;
  month?: string;
  pickedOnly: boolean;
}

interface Props {
  contents: ContentItem[];
  zones: Zone[];
  initialFilters: InitialHomeFilters;
  hotspots?: StoryCluster[];
  heatHistory?: HeatHistory | null;
}

const TABS: Array<{ label: string; contentType?: ContentType }> = [
  { label: "全部" },
  { label: "政策", contentType: "政策" },
  { label: "行业", contentType: "行业" },
  { label: "观点", contentType: "观点" },
  { label: "学术", contentType: "学术" },
  { label: "评级", contentType: "评级" },
];

const TYPE_COLORS: Record<ContentType, string> = {
  政策: "bg-info-soft text-info",
  行业: "bg-brand-soft text-brand-deep",
  观点: "bg-violet-soft text-violet-note",
  学术: "bg-calm-soft text-calm",
  评级: "bg-paper text-ink-soft",
};

function formatCount(value: number | undefined | null) {
  if (value == null || value <= 0) return "";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function academicRank(item: ContentItem) {
  let score = Number(item.academicScore ?? -1);
  if (item.recommended) score += 100;
  if (item.importanceLevel === "高") score += 10;
  else if (item.importanceLevel === "中") score += 5;
  return score;
}

function shortJournal(name?: string) {
  if (!name) return "";
  return name.length > 24 ? `${name.slice(0, 23)}…` : name;
}

function totalSourceCount(item: ContentItem) {
  return new Set(
    [item.sourceName, ...(item.sourceRefs || []).map((source) => source.sourceName)].filter(Boolean)
  ).size;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function formatEventTime(value: string) {
  if (!/[T\s]/.test(value)) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function weekdayLabel(date: string) {
  const value = new Date(`${date}T00:00:00+08:00`);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(value);
}

function relativeDay(date: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00+08:00`) - Date.parse(`${date}T00:00:00+08:00`)) / 86_400_000
  );
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return "";
}

function HotTopics({
  hotspots,
  heatHistory,
}: {
  hotspots?: StoryCluster[];
  heatHistory?: HeatHistory | null;
}) {
  const stories = (hotspots || []).slice(0, 5);
  if (stories.length === 0) return null;

  return (
    <section aria-labelledby="hot-topics-title">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Flame size={14} className="text-risk" aria-hidden />
          <h2 id="hot-topics-title" className="text-[13px] font-semibold text-ink">
            跨来源热点
          </h2>
        </div>
        <span className="text-[11px] text-ink-faint">48 小时 · 独立来源</span>
      </div>
      <ol className="divide-y divide-line border-y border-line">
        {stories.map((story, index) => {
          const heat = Math.round((story.heat || 0) * 10);
          const trend = story.trend || "unknown";
          const trendLabel =
            trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "new" ? "新" : "→";
          const trendClass =
            trend === "up"
              ? "text-calm"
              : trend === "down"
                ? "text-risk"
                : trend === "new"
                  ? "text-brand-deep"
                  : "text-ink-faint";
          const badges = story.badges || [];
          const badgeLabel = badges.includes("surge")
            ? "爆发"
            : badges.includes("rising")
              ? "上升"
              : badges.includes("new")
                ? "新"
                : "";
          const participants = new Set(story.participants || []).size;

          return (
            <li key={story.id} className={index >= 3 ? "hidden sm:block" : ""}>
              <Link
                href={`/events/${story.rootId}`}
                className="group flex items-center gap-3 py-2.5 transition-colors hover:text-brand-deep"
              >
                <span className="w-6 shrink-0 font-mono text-[12px] font-semibold text-risk">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink group-hover:text-brand-deep">
                    {story.title}
                  </span>
                  <span className="mt-0.5 hidden truncate text-[11px] text-ink-faint sm:block">
                    {(story.sourceNames || []).slice(0, 3).join(" / ") || story.digest}
                  </span>
                </span>
                {heatHistory?.stories[story.id] && (
                  <HeatSparkline
                    points={heatHistory.stories[story.id]}
                    className="hidden h-6 w-20 shrink-0 md:block"
                  />
                )}
                {badgeLabel && (
                  <span className="shrink-0 rounded bg-warn-soft px-1.5 py-0.5 text-[10px] text-warn">
                    {badgeLabel}
                  </span>
                )}
                <span className="shrink-0 text-right text-[11px] text-ink-faint">
                  <span className="block font-mono text-ink-soft">热度 {heat}</span>
                  <span className="hidden sm:inline">{participants} 家来源</span>
                </span>
                <span className={`w-4 shrink-0 text-center text-[12px] font-semibold ${trendClass}`}>
                  {trendLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FeedItem({
  item,
  zones,
  isHotspot,
  storySourceCount = 0,
}: {
  item: ContentItem;
  zones: Zone[];
  isHotspot: boolean;
  storySourceCount?: number;
}) {
  const itemZones = zones.filter((zone) => zone.eventIds.includes(item.id));
  const sourceCount = Math.max(totalSourceCount(item), storySourceCount);
  const reason = getRecommendReason(item);
  const eventTime = formatEventTime(item.publishedAt);

  return (
    <article className="group relative bg-surface transition-colors hover:bg-brand-soft/20">
      <Link href={`/events/${item.id}`} className="block px-3 py-4 pr-11 sm:px-5 sm:py-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span className={`rounded px-1.5 py-0.5 ${TYPE_COLORS[item.contentType]}`}>
            {item.contentType}
          </span>
          {eventTime && (
            <time
              className="inline-flex items-center gap-0.5 rounded bg-paper px-1.5 py-0.5 font-mono text-ink-soft"
              title={`发布于 ${item.publishedAt}`}
            >
              <Clock size={10} aria-hidden />
              {eventTime}
            </time>
          )}
          {item.recommended && (
            <span className="inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-surface">
              <Star size={9} className="fill-surface" aria-hidden />
              精选
            </span>
          )}
          {isHotspot && (
            <span className="inline-flex items-center gap-0.5 rounded bg-risk-soft px-1.5 py-0.5 text-risk">
              <Flame size={9} aria-hidden />
              热点
            </span>
          )}
          {item.region && (
            <span className="hidden items-center gap-1 text-ink-faint md:inline-flex">
              <MapPin size={10} aria-hidden />
              {item.region}
            </span>
          )}
          {sourceCount > 1 && (
            <span className="hidden rounded bg-paper px-1.5 py-0.5 text-ink-soft lg:inline">
              {sourceCount} 家独立来源
            </span>
          )}
          {typeof item.pipeline?.score === "number" && (
            <span
              className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                item.recommended ? "bg-brand-soft text-brand-deep" : "bg-paper text-ink-soft"
              }`}
              title={`综合评分（精选门槛 ${item.pipeline.scoreThreshold ?? 75}）`}
            >
              {item.pipeline.score} 分
            </span>
          )}
        </div>

        <h2 className="text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-deep sm:text-[17px]">
          {getHomeTitle(item)}
        </h2>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft sm:line-clamp-3 sm:text-[13px]">
          {summarizeForHome(getHomeSummary(item), 300)}
        </p>

        {reason && (
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-deep">
            <Star size={10} className="mt-1 shrink-0 fill-brand text-brand" aria-hidden />
            <span className="line-clamp-1">{reason}</span>
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-paper px-1.5 py-0.5 text-[10.5px] text-ink-soft">
            {item.esgTopic}
          </span>
          {itemZones.slice(0, 1).map((zone) => (
            <span
              key={zone.id}
              className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-deep"
            >
              {zone.name}
            </span>
          ))}
          {item.contentType === "学术" && item.journalName && (
            <span
              className="hidden max-w-56 truncate rounded bg-violet-soft px-1.5 py-0.5 text-[10px] text-violet-note sm:inline"
              title={item.journalName}
            >
              {shortJournal(item.journalName)}
            </span>
          )}
          {item.contentType === "学术" && Number(item.citationCount) > 0 && (
            <span className="hidden rounded bg-violet-soft px-1.5 py-0.5 font-mono text-[10px] text-violet-note sm:inline">
              引用 {formatCount(item.citationCount)}
            </span>
          )}
        </div>
      </Link>
      <a
        href={getContentLink(item)}
        target="_blank"
        rel="noreferrer"
        aria-label={`查看原文：${item.sourceName}`}
        title={`查看原文：${item.sourceName}`}
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep sm:right-4 sm:top-4"
      >
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </article>
  );
}

export default function HomeClient({
  contents,
  zones,
  initialFilters,
  hotspots,
  heatHistory,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialFilters.query);
  const deferredQuery = useDeferredValue(query);
  const [type, setType] = useState<ContentType | undefined>(initialFilters.type);
  const [month, setMonth] = useState(initialFilters.month || "");
  const [pickedOnly, setPickedOnly] = useState(initialFilters.pickedOnly);
  const [showAll, setShowAll] = useState(false);
  const CUTOFF = 20;

  const hotspotIds = useMemo(
    () => [...new Set((hotspots || []).flatMap((story) => story.memberIds))],
    [hotspots]
  );

  const months = useMemo(
    () =>
      Array.from(new Set(contents.map((item) => item.publishedAt.slice(0, 7)))).sort().reverse(),
    [contents]
  );

  const sourceCounts = useMemo(() => buildStorySourceCounts(contents), [contents]);

  const visible = useMemo(() => {
    const items = queryContents(contents, {
      q: deferredQuery,
      contentType: type,
      recommended: pickedOnly ? true : undefined,
      month: month || undefined,
    });
    return collapseByStory(items.filter((item) => isFeedEligible(item, sourceCounts)));
  }, [contents, deferredQuery, month, pickedOnly, sourceCounts, type]);

  const cappedPool = useMemo(() => {
    const pool = visible.filter((item) => item.academicExcluded !== true);
    if (type) return pool;
    const byDate: Record<string, ContentItem[]> = {};
    pool.forEach((item) => {
      const key = dateKey(item.publishedAt);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(item);
    });
    return Object.values(byDate).flatMap((items) => {
      const academic = items.filter((item) => item.contentType === "学术");
      if (academic.length <= 2) return items;
      return items
        .filter((item) => item.contentType !== "学术")
        .concat(academic.sort((a, b) => academicRank(b) - academicRank(a)).slice(0, 2));
    });
  }, [type, visible]);

  const allGroups = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    cappedPool.forEach((item) => {
      const key = dateKey(item.publishedAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [cappedPool]);

  const displayGroups = useMemo(() => {
    if (showAll) return allGroups;
    let count = 0;
    const result: Array<[string, ContentItem[]]> = [];
    for (const group of allGroups) {
      if (count >= CUTOFF) break;
      result.push(group);
      count += group[1].length;
    }
    return result;
  }, [allGroups, showAll]);

  const totalItems = allGroups.reduce((sum, group) => sum + group[1].length, 0);
  const displayedItems = displayGroups.reduce((sum, group) => sum + group[1].length, 0);
  const hiddenItems = totalItems - displayedItems;
  const hasFilters = Boolean(query.trim() || type || month || pickedOnly);
  const latestDate = contents[0]?.publishedAt.slice(0, 10);

  useEffect(() => {
    const initialIsEmpty =
      !initialFilters.query && !initialFilters.type && !initialFilters.month && !initialFilters.pickedOnly;
    if (!initialIsEmpty) return;

    const key = "esg-home-scroll-y";
    const saved = Number(sessionStorage.getItem(key));
    if (Number.isFinite(saved) && saved > 0) window.scrollTo(0, saved);
    sessionStorage.removeItem(key);

    let timer: ReturnType<typeof setTimeout> | undefined;
    function onScroll() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => sessionStorage.setItem(key, String(window.scrollY)), 120);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [initialFilters.month, initialFilters.pickedOnly, initialFilters.query, initialFilters.type]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    setShowAll(false);
  }, [deferredQuery, month, pickedOnly, type]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", CONTENT_TYPE_SLUGS[type]);
    if (month) params.set("month", month);
    if (pickedOnly) params.set("curated", "1");
    const nextUrl = params.size ? `/?${params.toString()}` : "/";
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [month, pickedOnly, query, type]);

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setQuery((params.get("q") || "").slice(0, 120));
      setType(contentTypeFromSlug(params.get("type")));
      const nextMonth = params.get("month");
      setMonth(nextMonth && /^\d{4}-\d{2}$/.test(nextMonth) ? nextMonth : "");
      setPickedOnly(params.get("curated") === "1" || params.get("curated") === "true");
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function clearFilters() {
    setQuery("");
    setType(undefined);
    setMonth("");
    setPickedOnly(false);
    setShowAll(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6" suppressHydrationWarning>
      <header className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">
            ESG 快讯
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            聚合政策、行业、观点与研究，快速定位值得跟进的变化。
          </p>
        </div>
        {latestDate && (
          <div className="hidden shrink-0 text-right text-[11px] text-ink-faint sm:block">
            <span className="block">最近更新</span>
            <time className="mt-0.5 block font-mono text-ink-soft">{latestDate}</time>
          </div>
        )}
      </header>

      <HotTopics hotspots={hotspots} heatHistory={heatHistory} />

      <section
        aria-label="内容筛选"
        className="rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div className="flex flex-col gap-2.5 border-b border-line p-2.5 sm:flex-row sm:items-center sm:p-3">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">搜索 ESG 资讯</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 120))}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  if (query) setQuery("");
                  else event.currentTarget.blur();
                }
              }}
              placeholder="搜索政策、公司、议题或来源"
              className="h-10 w-full rounded-lg border border-line bg-paper pl-9 pr-16 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-line focus:bg-surface focus:ring-2 focus:ring-brand-soft"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="清除搜索"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep"
              >
                <X size={14} aria-hidden />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
                /
              </kbd>
            )}
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={pickedOnly}
              onClick={() => setPickedOnly((value) => !value)}
              className={
                "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors sm:flex-none " +
                (pickedOnly
                  ? "border-brand-line bg-brand-soft text-brand-deep"
                  : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink")
              }
            >
              <Star size={13} className={pickedOnly ? "fill-brand text-brand" : ""} aria-hidden />
              只看精选
            </button>

            <label className="relative flex h-10 flex-1 items-center rounded-lg border border-line bg-surface sm:flex-none">
              <CalendarRange
                size={13}
                className="pointer-events-none absolute left-2.5 text-ink-faint"
                aria-hidden
              />
              <span className="sr-only">按月份筛选</span>
              <select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-full w-full appearance-none rounded-lg bg-transparent pl-8 pr-3 text-[12.5px] text-ink-soft outline-none focus:ring-2 focus:ring-brand-soft"
              >
                <option value="">全部月份</option>
                {months.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-2">
          <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto scrollbar-thin py-0.5">
            {TABS.map((tab) => {
              const active = type === tab.contentType;
              return (
                <button
                  key={tab.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(tab.contentType)}
                  className={
                    "shrink-0 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors " +
                    (active
                      ? "bg-brand font-medium text-surface"
                      : "text-ink-soft hover:bg-brand-soft hover:text-brand-deep")
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              title="清除全部筛选"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[11.5px] text-ink-faint transition-colors hover:bg-paper hover:text-ink-soft"
            >
              <RotateCcw size={12} aria-hidden />
              重置
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 text-[11.5px] text-ink-faint">
        <p className="min-w-0 truncate">
          {query.trim() ? `搜索“${query.trim()}”` : month ? `${month} 月归档` : "按发布时间倒序"}
          {hasFilters ? ` · ${totalItems} 条结果` : ""}
        </p>
        <p className="shrink-0 font-mono">
          {totalItems > 0 ? `${displayedItems} / ${totalItems}` : "0 条"}
        </p>
      </div>

      {totalItems === 0 ? (
        <section className="border-y border-line bg-surface px-5 py-12 text-center">
          <h2 className="text-[14px] font-semibold text-ink">
            {query.trim()
              ? "没有找到匹配内容"
              : month
                ? "该月份暂无内容"
                : type
                  ? "该分类暂无内容"
                  : pickedOnly
                    ? "暂无精选内容"
                    : "暂无发布内容"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-ink-faint">
            {hasFilters ? "可以缩短关键词，或清除筛选后查看全部资讯。" : "新内容发布后会显示在这里。"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep"
            >
              <RotateCcw size={12} aria-hidden />
              清除筛选
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-6">
          {displayGroups.map(([date, items]) => (
            <section key={date} aria-labelledby={`date-${date}`}>
              <div className="sticky top-14 z-[5] -mx-1 mb-2 flex items-center gap-2 bg-paper/95 px-1 py-2 backdrop-blur">
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand ring-4 ring-brand-soft" />
                <h2 id={`date-${date}`} className="font-mono text-[11px] font-semibold tracking-wide text-brand-deep">
                  {date} {weekdayLabel(date)}
                </h2>
                {relativeDay(date) && (
                  <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-deep">
                    {relativeDay(date)}
                  </span>
                )}
                <span className="ml-auto text-[10.5px] text-ink-faint">{items.length} 条</span>
              </div>
              <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                {items.map((item) => (
                  <FeedItem
                    key={item.id}
                    item={item}
                    zones={zones}
                    isHotspot={hotspotIds.includes(item.id)}
                    storySourceCount={sourceCounts.get(storyKey(item)) || 0}
                  />
                ))}
              </div>
            </section>
          ))}
          {hiddenItems > 0 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep"
              >
                <ChevronDown size={14} aria-hidden />
                展示更多（{hiddenItems} 条）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
