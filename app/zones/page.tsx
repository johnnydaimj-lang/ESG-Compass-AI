import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical } from "lucide-react";
import { getAllZones } from "@/lib/zones-store";
import { getRegulationsForZone } from "@/lib/regulations";
import { getAllContents } from "@/lib/esg-data";
import { isFeedEligible } from "@/lib/feed-policy";
import { recentCutoffDate, zoneMatches } from "@/lib/zones-data";

export const dynamic = "force-dynamic";

export default function ZonesPage() {
  const zones = getAllZones();
  const allContents = getAllContents();
  const cutoff = recentCutoffDate(30);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">知识专区</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          查看中国企业出海与跨境经营的监管指南，或使用互动工具理解 ESG 风险如何影响经营与财务。
        </p>
      </section>

      <section aria-labelledby="zone-tools-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-deep">互动工具</div>
            <h2 id="zone-tools-title" className="mt-1 text-xl font-semibold tracking-tight text-ink">从情景理解风险</h2>
          </div>
        </div>
        <Link href="/zones/climate-lab"
          className="group grid overflow-hidden rounded-xl border border-brand-line bg-brand-soft transition-all hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-7">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand text-surface"><FlaskConical size={19} /></div>
            <h3 className="text-xl font-semibold text-ink group-hover:text-brand-deep">气候风险实验室</h3>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft">选择地点、风险与情景，查看物理世界的变化如何传导至经营活动、资产价值和会计计量。</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-deep">打开互动工具 <ArrowRight size={14} /></div>
          </div>
          <div className="hidden min-w-48 place-items-center border-l border-brand-line px-8 md:grid">
            <div className="text-right">
              <div className="font-mono text-3xl font-semibold text-brand-deep">5</div>
              <div className="mt-1 text-[10px] text-ink-faint">类气候与转型风险</div>
            </div>
          </div>
        </Link>
      </section>

      <section aria-labelledby="regulatory-zones-title">
        <div className="mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">监管指南</div>
          <h2 id="regulatory-zones-title" className="mt-1 text-xl font-semibold tracking-tight text-ink">监管知识专区</h2>
        </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const recentEvents = allContents.filter(
            (c) => c.publishedAt >= cutoff && isFeedEligible(c) && zoneMatches(zone, c)
          );
          const regCount = getRegulationsForZone(zone.id, 50).filter((r) => r.publishedAt >= cutoff).length;
          return (
            <Link key={zone.id} href={`/zones/${zone.id}`}
              className="group flex flex-col rounded-lg border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink group-hover:text-brand-deep">{zone.name}</h2>
                <ArrowRight size={16} className="text-ink-faint transition-colors group-hover:text-brand-deep" />
              </div>
              <p className="mb-4 flex-1 text-[13px] leading-relaxed text-ink-soft">{zone.description}</p>
              <div className="flex items-center gap-3 text-[12px] text-ink-faint">
                <span className="rounded bg-paper px-2 py-1">近 1 个月 {recentEvents.length} 条核心事件</span>
                {regCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-brand-deep">
                    <BookOpen size={11} />近 1 个月 {regCount} 项法规标准
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      </section>
    </div>
  );
}
