"use client";

import { useMemo, useState } from "react";
import type { ContentItem, ContentType } from "@/lib/esg-data";
import ContentCard from "./ContentCard";

type CategoryTab = "全部" | "政策" | "专家观点" | "学术" | "评级";

const TABS: CategoryTab[] = ["全部", "政策", "专家观点", "学术", "评级"];

const TAB_TYPE_MAP: Partial<Record<CategoryTab, ContentType>> = {
  政策: "ESG 政策",
  专家观点: "专家观点",
  学术: "学术文章",
  评级: "评级动态",
};

interface HomeClientProps {
  focusContents: ContentItem[];
  watchContents: ContentItem[];
}

export default function HomeClient({ focusContents, watchContents }: HomeClientProps) {
  const [tab, setTab] = useState<CategoryTab>("全部");

  const visibleFocus = useMemo(() => {
    const type = TAB_TYPE_MAP[tab];
    const pool = type ? focusContents.filter((c) => c.contentType === type) : focusContents;
    return pool.slice(0, 3);
  }, [tab, focusContents]);

  return (
    <div className="space-y-12">
      {/* 今日重点：页面头部 */}
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">今日重点</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          汇总当下全球 ESG 政策、专家解读、学术研究与评级动态，每条都给出对企业的影响与应对建议，
          点击卡片直达信源原文。
        </p>
      </section>

      {/* 重点分析/解读 */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">重点分析/解读</h2>
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
            {visibleFocus.map((item, index) => (
              <ContentCard key={item.id} item={item} headline={index === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
            该分类下暂无重点内容
          </div>
        )}
      </section>

      {/* 风险观察 */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">风险观察</h2>
          <span className="text-[12px] text-ink-faint">高重要性或带风险标签的内容</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {watchContents.slice(0, 3).map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
