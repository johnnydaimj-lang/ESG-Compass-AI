import Link from "next/link";
import { ArrowUpRight, Flame, Newspaper, Star } from "lucide-react";
import { readDaily } from "@/lib/publication-store";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, string> = {
  政策: "bg-info-soft text-info",
  行业: "bg-brand-soft text-brand-deep",
  观点: "bg-violet-soft text-violet-note",
  学术: "bg-calm-soft text-calm",
  评级: "bg-paper text-ink-soft",
};

export default function DailyPage() {
  const report = readDaily();

  if (!report) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-[13px] text-ink-faint">
        日报尚未生成，请先运行一次数据管道。
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="border-b border-line pb-6">
        <div className="flex items-center gap-2 text-[12px] text-ink-faint">
          <Newspaper size={14} />
          <span>ESG 日报</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">全球 ESG 每日速览</h1>
        <p className="mt-1 font-mono text-[12px] text-ink-soft">{report.date}</p>
      </header>

      {report.highlights.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Star size={13} className="text-warn" />今日重点
          </h2>
          <div className="space-y-2">
            {report.highlights.map((item) => (
              <Link
                key={item.id}
                href={`/events/${item.id}`}
                className="block rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-brand-line hover:bg-brand-soft/30"
              >
                <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                  <span className={`rounded px-1.5 py-0.5 ${TYPE_COLORS[item.contentType] || "bg-paper text-ink-soft"}`}>{item.contentType}</span>
                  <span>{item.sourceName}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-medium leading-snug text-ink">{item.title}</p>
                {item.summary && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{item.summary}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {report.sections.map((section) => (
        <section key={section.label}>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{section.label}</h2>
          <div className="divide-y divide-line/60 rounded-lg border border-line bg-surface">
            {section.items.map((item) => (
              <Link key={item.id} href={`/events/${item.id}`} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-soft/30">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] ${TYPE_COLORS[item.contentType] || "bg-paper text-ink-soft"}`}>{item.contentType}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug font-medium text-ink group-hover:text-brand-deep">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{item.summary}</p>
                </div>
                <span className="mt-1 shrink-0 text-[11px] text-ink-faint">{item.sourceName}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {report.stories.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Flame size={13} className="text-risk" />跨来源热点故事
          </h2>
          <div className="space-y-2">
            {report.stories.map((story) => (
              <div key={story.id} className="rounded-lg border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                  <span className="rounded bg-risk-soft px-1.5 py-0.5 text-risk">{story.sourceName}</span>
                  <span className="font-mono">{story.publishedAt.slice(0, 10)}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-medium leading-snug text-ink">{story.title}</p>
                {story.summary && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{story.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        <ArrowUpRight size={11} />
        生成于 {new Date(report.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
      </footer>
    </article>
  );
}
