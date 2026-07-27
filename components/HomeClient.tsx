"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, TriangleAlert, Users } from "lucide-react";
import type { EventItem, EventType } from "@/lib/esg-data";
import { sortByPriority } from "@/lib/priority-rules";
import type { HomeMetrics } from "@/lib/analytics";
import EventCard from "./EventCard";
import MetricCard from "./MetricCard";

type CategoryTab = "全部" | "政策" | "客户" | "风险" | "奖项" | "评级";

const TABS: CategoryTab[] = ["全部", "政策", "客户", "风险", "奖项", "评级"];

const TAB_TYPE_MAP: Partial<Record<CategoryTab, EventType>> = {
  政策: "政策法规",
  客户: "客户/链主要求",
  风险: "行业风险事件",
  奖项: "奖项申报",
  评级: "评级动态",
};

const PREFS_KEY = "esg-follow-prefs";

interface FollowPrefs {
  regions: string[];
  eventTypes: string[];
  topicTags: string[];
  riskTags: string[];
}

function readPrefs(): FollowPrefs | null {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FollowPrefs;
  } catch {
    return null;
  }
}

// 订阅中心保存的关注偏好：命中的事件在首页前移
function applyPreferenceOrder(events: EventItem[], prefs: FollowPrefs | null): EventItem[] {
  if (!prefs) return events;
  const prefScore = (e: EventItem) => {
    let score = 0;
    if (prefs.regions.includes(e.region)) score += 2;
    if (prefs.eventTypes.includes(e.eventType)) score += 2;
    score += e.topicTags.filter((t) => prefs.topicTags.includes(t)).length;
    score += e.riskTags.filter((t) => prefs.riskTags.includes(t)).length;
    return score;
  };
  return [...events].sort((a, b) => prefScore(b) - prefScore(a));
}

interface HomeClientProps {
  metrics: HomeMetrics;
  focusEvents: EventItem[];
  watchEvents: EventItem[];
}

export default function HomeClient({ metrics, focusEvents, watchEvents }: HomeClientProps) {
  const [tab, setTab] = useState<CategoryTab>("全部");
  const [prefs, setPrefs] = useState<FollowPrefs | null>(null);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  const orderedFocus = useMemo(() => applyPreferenceOrder(focusEvents, prefs), [focusEvents, prefs]);
  const orderedWatch = useMemo(() => applyPreferenceOrder(watchEvents, prefs), [watchEvents, prefs]);

  const visibleFocus = useMemo(() => {
    const type = TAB_TYPE_MAP[tab];
    const pool = type ? orderedFocus.filter((e) => e.eventType === type) : orderedFocus;
    return pool.slice(0, 3);
  }, [tab, orderedFocus]);

  const hasPrefs =
    prefs !== null &&
    (prefs.regions.length > 0 || prefs.eventTypes.length > 0 || prefs.topicTags.length > 0 || prefs.riskTags.length > 0);

  return (
    <div className="space-y-12">
      {/* Hero 区 */}
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">ESG 简报</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          面向业务与合规团队的全球 ESG 变化情报：把政策法规、客户要求、行业风险、奖项与评级动态
          整理成可直接行动的事件卡片，帮助管理层快速判断外部变化对经营连续性、客户审核和准入的影响。
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="今日重点" value={metrics.todayFocusCount} hint="近 7 天新增事件" icon={Flame} tone="brand" />
          <MetricCard label="高优先级" value={metrics.highPriorityCount} hint="需要管理层关注" icon={TriangleAlert} tone="risk" />
          <MetricCard label="客户压力" value={metrics.clientPressureCount} hint="客户/链主新要求" icon={Users} tone="violet" />
        </div>
      </section>

      {/* 今日重点 */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink">今日重点</h2>
            {hasPrefs && (
              <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] text-brand-deep">
                已按关注偏好重排
              </span>
            )}
          </div>
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
                  tab === t ? "bg-brand font-medium text-surface" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {visibleFocus.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {visibleFocus.map((event, index) => (
              <EventCard key={event.id} event={event} headline={index === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
            该分类下暂无今日重点事件
          </div>
        )}
      </section>

      {/* 风险观察 */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">风险观察</h2>
          <span className="text-[12px] text-ink-faint">高优先级或带风险标签的事件</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {orderedWatch.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* ESG 评级与奖项 */}
      <section className="rounded-lg border border-line bg-surface px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">ESG 评级与奖项</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              奖项申报窗口与评级方法口径变化单独成栏，不占用首页主线资源。需要申报背书或准备复评时，
              到专栏集中查看窗口期与口径变化。
            </p>
          </div>
          <Link
            href="/column"
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-4 py-2 text-[13px] font-medium text-brand-deep transition-colors hover:bg-brand-line/50"
          >
            进入专栏
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
