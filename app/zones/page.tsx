import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllContents } from "@/lib/esg-data";
import { getAllZones } from "@/lib/zones-data";

export default function ZonesPage() {
  const zones = getAllZones();
  const contents = getAllContents();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">知识专区</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          按核心议题梳理全球 ESG 关键政策框架的演进脉络，每条专区包含重要里程碑与关联事件。
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const eventCount = zone.eventIds.length;
          const milestoneCount = zone.milestones.length;
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
