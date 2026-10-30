import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  FileSearch,
  Layers3,
  ScanText,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import weekly from "@/data/wechat/weekly/2026-w43.json";

export const metadata: Metadata = {
  title: "第 01 期｜从自然披露到气候适应",
  description: weekly.deck,
  robots: {
    index: false,
    follow: false,
  },
};

const statItems = [
  { label: "本周扫描", value: weekly.stats.itemsScanned, suffix: " 条" },
  { label: "区间内容", value: weekly.stats.itemsInRange, suffix: " 条" },
  { label: "主线议题", value: weekly.stats.mainStories, suffix: " 个" },
  { label: "预计阅读", value: weekly.stats.readingMinutes, suffix: " 分钟" },
];

export default function Weekly2026W43Page() {
  return (
    <article className="mx-auto max-w-5xl pb-8">
      <div className="border-x border-line bg-surface">
        <header className="relative overflow-hidden border-b border-line">
          <div className="absolute inset-y-0 right-0 hidden w-[30%] border-l border-line bg-brand-soft/45 lg:block">
            <div className="flex h-full items-center justify-center">
              <span className="select-none font-mono text-[142px] font-semibold leading-none tracking-normal text-brand/10">
                01
              </span>
            </div>
          </div>

          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LogoMark className="h-10 w-10 text-brand" />
                <div>
                  <p className="text-[17px] font-semibold leading-none text-ink">观澜</p>
                  <p className="mt-1.5 text-[9px] font-semibold uppercase leading-none text-ink-faint">
                    ESG Compass
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-warn/25 bg-warn-soft px-3 py-1.5 text-[11px] font-medium text-warn">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                历史预览 · 后续周报周一 08:00 发布
              </div>
            </div>

            <div className="mt-12 max-w-3xl lg:mt-16 lg:max-w-[620px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase text-ink-faint">
                <span className="font-semibold text-brand">Weekly Brief</span>
                <span className="h-px w-7 bg-line-strong" />
                <span>Issue 01</span>
                <span>2026 / W43</span>
              </div>
              <h1 className="mt-5 text-[32px] font-semibold leading-[1.22] text-ink sm:text-[42px] lg:text-[50px]">
                {weekly.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-[14px] leading-7 text-ink-soft sm:text-[15px]">
                {weekly.deck}
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-[11px] text-ink-soft">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-brand" />
                2026.10.19—10.25
              </span>
              <span className="flex items-center gap-1.5">
                <Layers3 size={13} className="text-brand" />
                第 43 周
              </span>
              <span className="flex items-center gap-1.5">
                <ScanText size={13} className="text-brand" />
                5 个主议题 · 2 条快讯
              </span>
            </div>
          </div>
        </header>

        <section aria-label="本周数据" className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className={`px-5 py-5 sm:px-6 ${index % 2 !== 0 ? "border-l border-line" : ""} ${
                index >= 2 ? "border-t border-line sm:border-t-0" : ""
              } ${index > 0 ? "sm:border-l sm:border-line" : ""}`}
            >
              <p className="text-[10px] uppercase text-ink-faint">{item.label}</p>
              <p className="mt-1.5 font-mono text-[22px] font-semibold text-ink">
                {item.value}
                <span className="ml-1 text-[10px] font-normal text-ink-faint">{item.suffix}</span>
              </p>
            </div>
          ))}
        </section>

        <div className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <section className="grid gap-7 border-b border-line pb-10 lg:grid-cols-[160px_1fr] lg:gap-12">
            <div>
              <p className="text-[10px] font-semibold uppercase text-brand">Editor&apos;s Note</p>
              <h2 className="mt-2 text-[18px] font-semibold text-ink">本期导读</h2>
            </div>
            <div>
              <p className="text-[15px] font-medium leading-8 text-ink">{weekly.intro}</p>
              <ol className="mt-7 divide-y divide-line border-y border-line">
                {weekly.contents.map((item, index) => (
                  <li key={item} className="flex gap-4 py-3.5">
                    <span className="font-mono text-[11px] font-semibold text-brand">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-medium leading-6 text-ink-soft">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mt-12 space-y-14 sm:mt-16 sm:space-y-16">
            {weekly.stories.map((story) => (
              <article key={story.number} className="border-t-2 border-ink pt-5 sm:pt-6">
                <div className="grid gap-6 lg:grid-cols-[120px_1fr] lg:gap-10">
                  <aside>
                    <p className="font-mono text-[38px] font-semibold leading-none text-line-strong">
                      {story.number}
                    </p>
                    <span className="mt-4 inline-flex rounded bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand-deep">
                      {story.category}
                    </span>
                  </aside>

                  <div className="min-w-0">
                    <h2 className="text-[25px] font-semibold leading-[1.35] text-ink sm:text-[31px]">
                      {story.title}
                    </h2>
                    <p className="mt-3 text-[12px] leading-5 text-ink-faint">{story.originalTitle}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-soft">
                      <span>{story.source}</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                      <span className="font-mono">{story.sourceDate}</span>
                      <Link
                        href={story.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand transition-colors hover:text-brand-deep"
                      >
                        查看原文 <ArrowUpRight size={11} />
                      </Link>
                    </div>

                    <div className="mt-7">
                      <p className="text-[10px] font-semibold uppercase text-ink-faint">What Happened</p>
                      <p className="mt-2 text-[14px] leading-7 text-ink-soft">{story.fact}</p>
                    </div>

                    <div className="mt-6 border-l-2 border-brand bg-brand-soft/45 px-5 py-4">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-deep">
                        <BookOpenText size={13} />
                        观澜解读
                      </p>
                      <p className="mt-2 text-[14px] leading-7 text-ink">{story.interpretation}</p>
                    </div>

                    <div className="mt-6">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                        <FileSearch size={13} className="text-brand" />
                        后续观察点
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {story.watchpoints.map((point) => (
                          <li key={point} className="flex gap-2.5 text-[13px] leading-6 text-ink-soft">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {story.stakeholders.map((item) => (
                        <span key={item} className="rounded border border-line px-2 py-1 text-[10px] text-ink-faint">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-16 border-t-2 border-ink pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-brand">Quick Briefs</p>
                <h2 className="mt-1.5 text-[22px] font-semibold text-ink">本周快讯</h2>
              </div>
              <p className="hidden text-[11px] text-ink-faint sm:block">两条值得留意的配套信号</p>
            </div>
            <div className="mt-6 grid border-y border-line md:grid-cols-2">
              {weekly.quickBriefs.map((brief, index) => (
                <Link
                  key={brief.title}
                  href={brief.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group px-0 py-5 transition-colors hover:bg-brand-soft/30 md:px-6 ${
                    index === 1 ? "border-t border-line md:border-l md:border-t-0" : "md:-ml-6"
                  }`}
                >
                  <span className="text-[10px] font-medium text-brand">{brief.category}</span>
                  <h3 className="mt-2 text-[16px] font-semibold leading-6 text-ink group-hover:text-brand-deep">
                    {brief.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-6 text-ink-soft">{brief.fact}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-ink-faint group-hover:text-brand">
                    阅读来源 <ArrowUpRight size={11} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 border-t border-line pt-8">
            <div className="grid gap-6 lg:grid-cols-[120px_1fr] lg:gap-10">
              <div>
                <p className="text-[10px] font-semibold uppercase text-brand">Outlook</p>
                <h2 className="mt-1.5 text-[18px] font-semibold text-ink">下周看什么</h2>
              </div>
              <p className="text-[14px] leading-8 text-ink-soft">{weekly.outlook}</p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-x border-b border-line bg-paper px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7 text-brand" />
              <div>
                <p className="text-[14px] font-semibold text-ink">观澜 ESG Compass</p>
                <p className="mt-0.5 text-[9px] uppercase text-ink-faint">See the change. Find the signal.</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[11px] leading-5 text-ink-faint">
              每周筛选全球 ESG 关键变化，用事实、解读和观察点帮助读者理解规则与资本流向。
            </p>
            <div className="mt-5 flex items-center gap-2 text-[10px] text-ink-faint">
              <Clock3 size={11} />
              更新时间：每周一 08:00（北京时间）
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-ink">本期信源</h3>
            <ol className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
              {weekly.sources.map((source, index) => (
                <li key={source.url} className="flex gap-2 text-[10.5px] leading-5 text-ink-faint">
                  <span className="font-mono text-brand">{String(index + 1).padStart(2, "0")}</span>
                  <Link
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-brand"
                  >
                    {source.name}
                  </Link>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-line pt-4 text-[10px] leading-5 text-ink-faint">
              {weekly.editorial.methodology}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-line pt-4 text-[9.5px] text-ink-faint sm:flex-row">
          <span>观澜 ESG Compass · 第 01 期 · 2026 年第 43 周</span>
          <span>AI 辅助整理，发布前需人工审阅 · 预览稿</span>
        </div>
      </footer>
    </article>
  );
}
