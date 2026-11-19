import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllZones, getZoneById } from "@/lib/zones-store";
import WorldMapSection from "@/components/WorldMapSection";
import { getRegulationsForZone } from "@/lib/regulations";
import { getContentLink, getHomeTitle } from "@/lib/esg-data";
import { getProgressForZone } from "@/lib/event-progress-store";

interface Props { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const zone = getZoneById(id);
  return { title: zone ? zone.name : "专区未找到" }
}

export default async function ZoneDetailPage({ params }: Props) {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const zone = getZoneById(id);
  if (!zone) notFound();
  const matters = getProgressForZone(zone.id);
  const contentRegulations = getRegulationsForZone(zone.id, 50).map((c) => ({
    region: c.region,
    title: getHomeTitle(c),
    href: getContentLink(c),
    sourceName: c.sourceName,
    publishedAt: c.publishedAt,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <Link href="/zones" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />知识专区
      </Link>

      <section>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{zone.name}</h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-soft">{zone.description}</p>
      </section>

      {matters.length > 0 && <section aria-labelledby="matter-updates-title">
        <h2 id="matter-updates-title" className="mb-3 text-[15px] font-semibold text-ink">相关事项进展</h2>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface px-5">
          {matters.slice(0, 5).map((matter) => {
            const latest = matter.entries[0];
            return <Link key={matter.id} href={matter.href} className="block py-4 hover:text-brand-deep">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
                <span>{matter.region}</span><span className="font-medium text-brand-deep">{latest.stage}</span>
                <time dateTime={latest.date}>{latest.dateLabel} {latest.date}</time>
              </div>
              <h3 className="text-[14px] font-medium">{matter.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{latest.change}</p>
              <span className="mt-2 inline-block text-[12px] font-medium text-brand-deep">查看事项与进展 →</span>
            </Link>;
          })}
        </div>
        {matters.length > 5 && <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-brand-deep">更多事项 · {matters.length - 5}</summary>
          <ul className="mt-2 space-y-2">{matters.slice(5).map((matter) => <li key={matter.id}><Link href={matter.href} className="text-[13px] text-brand-deep hover:underline">{matter.title} · {matter.entries[0].stage}</Link></li>)}</ul>
        </details>}
      </section>}
      <WorldMapSection regions={zone.regions || []} zoneName={zone.name} fallbackMilestones={zone.milestones} contentRegulations={contentRegulations} />
    </div>
  );
}
