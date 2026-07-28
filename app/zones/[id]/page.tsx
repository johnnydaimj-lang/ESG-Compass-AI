import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { getAllZones, getZoneById } from "@/lib/zones-data";
import { getContentById } from "@/lib/esg-data";

interface Props { params: Promise<{ id: string }> }
export function generateStaticParams() { return getAllZones().map((z) => ({ id: z.id })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; const zone = getZoneById(id);
  return { title: zone ? zone.name : "专区未找到" }
}

export default async function ZoneDetailPage({ params }: Props) {
  const { id } = await params; const zone = getZoneById(id);
  if (!zone) notFound();

  const relatedEvents = zone.eventIds
    .map((eid) => getContentById(eid))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <Link href="/zones" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />知识专区
      </Link>

      <section>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{zone.name}</h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-soft">{zone.description}</p>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-6 text-lg font-semibold text-ink">关键里程碑</h2>
        <div className="relative pl-8 before:absolute before:left-3 before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-line-strong">
          {zone.milestones.map((m, i) => (
            <div key={i} className="relative mb-8 last:mb-0">
              <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-brand bg-surface" />
              <time className="mb-1 block font-mono text-[12px] text-ink-faint">{m.date}</time>
              <h3 className="mb-1 text-[15px] font-semibold text-ink">{m.title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-soft">{m.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">关联事件</h2>
          <div className="space-y-3">
            {relatedEvents.map((evt) =>
              evt ? (
                <Link key={evt.id} href={`/events/${evt.id}`}
                  className="group block rounded-lg border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium">
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">{evt.contentType}</span>
                    <span className="inline-flex items-center gap-1 text-ink-faint"><MapPin size={11} />{evt.region}</span>
                    <time className="font-mono text-ink-faint">{evt.publishedAt}</time>
                  </div>
                  <h3 className="mb-1 text-[15px] font-semibold text-ink group-hover:text-brand-deep">{evt.title}</h3>
                  <p className="text-[13px] leading-relaxed text-ink-soft">{evt.summary}</p>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}
    </div>
  );
}
