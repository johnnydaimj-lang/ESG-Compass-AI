import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ClimateRiskLab from "@/components/ClimateRiskLab";
import { getRegulationsForZone } from "@/lib/regulations";
import { getContentLink } from "@/lib/esg-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "气候风险实验室",
  description: "通过地点、气候与转型情景理解经营和财务影响。",
};

export default function ClimateLabPage() {
  const relatedEvents = getRegulationsForZone("climate-risk", 50).map((item) => ({
    title: item.title,
    href: getContentLink(item),
    sourceName: item.sourceName,
    publishedAt: item.publishedAt,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/zones" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
          <ArrowLeft size={14} />知识专区
        </Link>
        <Link href="/zones/climate-risk" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-deep transition-opacity hover:opacity-70">
          查看气候法规与事件 <ArrowRight size={13} />
        </Link>
      </div>

      <section>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-deep">互动工具</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">气候风险实验室</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">从一个地点出发，探索气候与转型情景如何影响经营活动、现金流、资产价值和会计判断。</p>
      </section>

      <ClimateRiskLab events={relatedEvents} />
    </div>
  );
}
