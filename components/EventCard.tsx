import { ArrowUpRight, MapPin } from "lucide-react";
import type { EventItem, EventType, ImportanceLevel } from "@/lib/esg-data";

export const IMPORTANCE_STYLES: Record<ImportanceLevel, string> = {
  高: "bg-risk-soft text-risk",
  中: "bg-warn-soft text-warn",
  低: "bg-paper text-ink-soft",
};

export const EVENT_TYPE_STYLES: Record<EventType, string> = {
  政策法规: "bg-info-soft text-info",
  "客户/链主要求": "bg-violet-soft text-violet-note",
  行业风险事件: "bg-risk-soft text-risk",
  奖项申报: "bg-calm-soft text-calm",
  评级动态: "bg-paper text-ink-soft",
};

interface EventCardProps {
  event: EventItem;
  headline?: boolean;
  showWhyImportant?: boolean;
}

export default function EventCard({ event, headline = false, showWhyImportant = true }: EventCardProps) {
  return (
    <a
      href={event.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={`group flex h-full flex-col rounded-lg border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-line hover:shadow-md ${
        headline ? "border-brand-line shadow-sm" : "border-line"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <span className={`rounded px-1.5 py-0.5 ${IMPORTANCE_STYLES[event.importanceLevel]}`}>
          {event.importanceLevel}
        </span>
        <span className={`rounded px-1.5 py-0.5 ${EVENT_TYPE_STYLES[event.eventType]}`}>
          {event.eventType}
        </span>
        {headline && (
          <span className="rounded bg-brand px-1.5 py-0.5 text-surface">头条</span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-ink-faint">
          <MapPin size={11} />
          {event.region}
        </span>
        <time className="font-mono text-ink-faint">{event.publishedAt}</time>
      </div>

      <h3 className="mb-2 flex items-start gap-1 text-[15px] leading-snug font-semibold text-ink group-hover:text-brand-deep">
        <span className="min-w-0">{event.title}</span>
        <ArrowUpRight
          size={14}
          className="mt-1 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </h3>

      <p className="mb-3 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">{event.summary}</p>

      {showWhyImportant && (
        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-1 text-[11px] font-medium text-ink-faint">判定依据</div>
          <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{event.whyImportant}</p>
        </div>
      )}
    </a>
  );
}
