"use client";
import { useMemo, useState } from "react";
import type { ContentItem, ContentType } from "@/lib/esg-data";
import ContentCard from "./ContentCard";

type Tab = "全部" | "政策" | "专家观点" | "学术" | "评级";
const TABS: Tab[] = ["全部", "政策", "专家观点", "学术", "评级"];
const TAB_TYPE: Partial<Record<Tab, ContentType>> = { 政策: "ESG 政策", 专家观点: "专家观点", 学术: "学术文章", 评级: "评级动态" };

interface Props { contents: ContentItem[] }

export default function HomeClient({ contents }: Props) {
  const [tab, setTab] = useState<Tab>("全部");
  const visible = useMemo(() => {
    const type = TAB_TYPE[tab];
    const pool = type ? contents.filter((c) => c.contentType === type) : contents;
    return pool.slice(0, 3);
  }, [tab, contents]);
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">今日重点</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          汇总当下全球 ESG 政策、专家解读、学术研究与评级动态，按时间由近到远排列，点击卡片查看详情与所属 ESG 议题。
        </p>
      </section>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">重点分析/解读</h2>
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${tab === t ? "bg-brand font-medium text-surface" : "text-ink-soft hover:text-ink"}`}>{t}</button>
            ))}
          </div>
        </div>
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {visible.map((item, i) => <ContentCard key={item.id} item={item} headline={i === 0} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">该分类下暂无内容</div>
        )}
      </section>
    </div>
  );
}
