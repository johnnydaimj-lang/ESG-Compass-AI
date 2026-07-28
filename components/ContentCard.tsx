import { ArrowUpRight, MapPin } from "lucide-react";
import type { ContentItem, ContentType, ImportanceLevel } from "@/lib/esg-data";

const IMPORTANCE_STYLES: Record<ImportanceLevel, string> = {
  高: "bg-risk-soft text-risk",
  中: "bg-warn-soft text-warn",
  低: "bg-paper text-ink-soft",
};

const TYPE_STYLES: Record<ContentType, string> = {
  "ESG 政策": "bg-info-soft text-info",
  专家观点: "bg-violet-soft text-violet-note",
  学术文章: "bg-calm-soft text-calm",
  评级动态: "bg-paper text-ink-soft",
};

interface ContentCardProps {
  item: ContentItem;
  headline?: boolean;
}

export default function ContentCard({ item, headline = false }: ContentCardProps) {
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={`group flex h-full flex-col rounded-lg border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-md ${
        headline ? "border-brand-line shadow-sm" : "border-line"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className={`rounded px-1.5 py-0.5 ${IMPORTANCE_STYLES[item.importanceLevel]}`}>
          {item.importanceLevel}
        </span>
        <span className={`rounded px-1.5 py-0.5 ${TYPE_STYLES[item.contentType]}`}>
          {item.contentType}
        </span>
        {headline && <span className="rounded bg-brand px-1.5 py-0.5 text-surface">头条</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-ink-faint">
          <MapPin size={11} />
          {item.region}
        </span>
        <time className="font-mono text-ink-faint">{item.publishedAt}</time>
      </div>

      <h3 className="mb-2 flex items-start gap-1 text-[15px] leading-snug font-semibold text-ink group-hover:text-brand-deep">
        <span className="min-w-0">{item.title}</span>
        <ArrowUpRight
          size={14}
          className="mt-1 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </h3>

      <p className="mb-3 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">{item.summary}</p>

      <div className="mt-auto border-t border-line pt-3">
        <div className="mb-1 text-[11px] font-medium text-ink-faint">判定依据</div>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{item.whyImportant}</p>
      </div>
    </a>
  );
}
