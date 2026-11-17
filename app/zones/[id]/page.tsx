import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllZones, getZoneById } from "@/lib/zones-store";
import WorldMapSection from "@/components/WorldMapSection";
import { getRegulationsForZone } from "@/lib/regulations";
import { getContentLink } from "@/lib/esg-data";
import ClimateRiskLab from "@/components/ClimateRiskLab";

interface Props { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const zone = getZoneById(id);
  return { title: zone ? zone.name : "专区未找到" }
}

export default async function ZoneDetailPage({ params }: Props) {
  const { id: rawId } = await params; const id = decodeURIComponent(rawId); const zone = getZoneById(id);
  if (!zone) notFound();
  const contentRegulations = getRegulationsForZone(zone.id, 50).map((c) => ({
    region: c.region,
    title: c.title,
    href: getContentLink(c),
    sourceName: c.sourceName,
    publishedAt: c.publishedAt,
  }));

  return (
    <div className={`mx-auto space-y-10 ${zone.id === "climate-risk" ? "max-w-6xl" : "max-w-3xl"}`}>
      <Link href="/zones" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />知识专区
      </Link>

      <section>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{zone.name}</h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-soft">{zone.description}</p>
      </section>

      {zone.id === "climate-risk" ? (
        <ClimateRiskLab events={contentRegulations} />
      ) : null}

      <WorldMapSection regions={zone.regions || []} zoneName={zone.name} fallbackMilestones={zone.milestones} contentRegulations={contentRegulations} />
    </div>
  );
}
