import type { HeatPoint } from "@/lib/contracts/pipeline";

export default function HeatSparkline({ points, className = "h-10 w-full" }: { points: HeatPoint[]; className?: string }) {
  const values = points.map((p) => p.heat);
  const seen = values.filter((v) => v > 0);
  if (seen.length < 2) return <span className={"block " + className} aria-hidden="true" />;
  const W = 120;
  const H = 36;
  const pad = 3;
  const max = Math.max(...seen) || 1;
  const step = (W - pad * 2) / Math.max(1, values.length - 1);
  const x = (i: number) => pad + i * step;
  const y = (v: number) => pad + (1 - v / max) * (H - pad * 2);
  const coords = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <polyline points={coords} fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r="2.5" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="1.5" />
    </svg>
  );
}
