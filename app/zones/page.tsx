import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getAllZones, getZoneKeywords } from "@/lib/zones-store";
import { getKBForZone } from "@/lib/knowledge-base";
import { getAllContents } from "@/lib/esg-data";

export default function ZonesPage() {
  const zones = getAllZones();
  const allContents = getAllContents();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">知识专区</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          按核心议题梳理全球 ESG 关键政策框架的演进脉络，每条专区包含重要里程碑、关联事件与参考法规标准。
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const eventCount = zone.eventIds.length + allContents.filter((c) =>
            getZoneKeywords(zone.id).some((k) => `${c.title} ${c.summary} ${c.esgTopic}`.toLowerCase().includes(k))
          ).length;
          const milestoneCount = zone.milestones.length;
          const kbCount = getKBForZone(zone.id).length;
          return (
            <Link key={zone.id} href={`/zones/${zone.id}`}
              className="group flex flex-col rounded-lg border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink group-hover:text-brand-deep">{zone.name}</h2>
                <ArrowRight size={16} className="text-ink-faint transition-colors group-hover:text-brand-deep" />
              </div>
              <p className="mb-4 flex-1 text-[13px] leading-relaxed text-ink-soft">{zone.description}</p>
              <div className="flex items-center gap-3 text-[12px] text-ink-faint">
                <span className="rounded bg-paper px-2 py-1">{eventCount} 个关联事件</span>
                <span className="rounded bg-paper px-2 py-1">{milestoneCount} 个关键里程碑</span>
                {kbCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-brand-deep">
                    <BookOpen size={11} />{kbCount} 项法规标准
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
