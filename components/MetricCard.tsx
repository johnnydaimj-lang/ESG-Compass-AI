import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone?: "brand" | "risk" | "violet";
}

const TONE_STYLES: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  brand: "bg-brand-soft text-brand-deep",
  risk: "bg-risk-soft text-risk",
  violet: "bg-violet-soft text-violet-note",
};

export default function MetricCard({ label, value, hint, icon: Icon, tone = "brand" }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${TONE_STYLES[tone]}`}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] text-ink-faint">{label}</div>
        <div className="font-mono text-2xl font-semibold text-ink">{value}</div>
        <div className="truncate text-[11px] text-ink-faint">{hint}</div>
      </div>
    </div>
  );
}
