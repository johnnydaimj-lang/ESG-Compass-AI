import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getAllZones } from "@/lib/zones-store";
import { getRegulationsForZone } from "@/lib/regulations";
import { getAllContents } from "@/lib/esg-data";
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
          面向中国企业出海与跨境经营的合规监管指南：按地区查看监管要求、关键文件、风险来源与执法时间线。
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const recentEvents = allContents.filter((c) => c.publishedAt >= cutoff && zoneMatches(zone, c));
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
    </div>
  );
}
