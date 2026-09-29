"use client";

import { useMemo, useState } from "react";
import type { HeatPoint } from "@/lib/contracts/pipeline";

const HOUR = 3_600_000;
const W = 720;
const H = 260;
const PAD = { l: 48, r: 16, t: 14, b: 40 };

function niceStep(max: number): number {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const found = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  return found ?? (raw || 1);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export default function HeatChart({ points }: { points: HeatPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (points.length === 0) return null;
    const start = Date.parse(points[0].hour);
    const end = Date.parse(points[points.length - 1].hour);
    const byHour = new Map(points.map((p) => [Date.parse(p.hour), p]));
    const series: Array<{ t: number; p: HeatPoint | null }> = [];
    for (let t = start; t <= end; t += HOUR) series.push({ t, p: byHour.get(t) ?? null });
    const seen = series.filter((s) => s.p && s.p.heat > 0);
    if (seen.length < 3) return null;

    const display = (p: HeatPoint) => Math.round(p.heat * 10);
    const last = seen[seen.length - 1]!;
    const peak = seen.reduce((a, b) => (display(b.p!) > display(a.p!) ? b : a));
    const dayAgo = series.find((s) => s.t === last.t - 24 * HOUR)?.p;
    const change = dayAgo && dayAgo.heat > 0 ? Math.round(((last.p!.heat - dayAgo.heat) / dayAgo.heat) * 100) : null;

    const maxVal = Math.max(...seen.map((s) => display(s.p!))) || 1;
    const step = niceStep(maxVal);
    const top = Math.max(step, Math.ceil(maxVal / step) * step);
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

    const t0 = series[0].t;
    const span = Math.max(HOUR, series[series.length - 1].t - t0);
    const x = (t: number) => PAD.l + ((t - t0) / span) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
    const base = H - PAD.b;

    const runs: Array<Array<{ t: number; p: HeatPoint }>> = [];
    let run: Array<{ t: number; p: HeatPoint }> = [];
    for (const s of series) {
      if (s.p && s.p.heat > 0) run.push({ t: s.t, p: s.p });
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);

    const line = runs
      .map((r) => r.map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)} ${y(display(s.p)).toFixed(1)}`).join(" "))
      .join(" ");
    const area = runs
      .map((r) => {
        if (r.length < 2) return "";
        const pts = r.map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)} ${y(display(s.p)).toFixed(1)}`).join(" ");
        return `${pts} L${x(r[r.length - 1].t).toFixed(1)} ${base} L${x(r[0].t).toFixed(1)} ${base} Z`;
      })
      .join(" ");

    const labels = [0, 1 / 3, 2 / 3, 1].map((f) => t0 + Math.round((f * span) / HOUR) * HOUR);
    return { seen, last, peak, change, ticks, x, y, base, line, area, labels, display };
  }, [points]);

  if (!geom) {
    return <p className="rounded-lg bg-paper px-4 py-8 text-center text-[13px] text-ink-faint">还没有足够的连续观测数据，暂不绘制趋势。</p>;
  }

  const { seen, last, peak, change, ticks, x, y, base, line, area, labels, display } = geom;
  const cur = active !== null ? seen[active] : null;
  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    seen.forEach((s, i) => {
      if (Math.abs(x(s.t) - px) < Math.abs(x(seen[best].t) - px)) best = i;
    });
    setActive(best);
  };

  return (
    <div>
      <p className="text-[12.5px] text-ink-soft">
        当前热度 <b className="font-semibold text-ink">{display(last.p!)}</b>
        <span className="mx-1.5 text-ink-faint">·</span>
        可比范围峰值 <b className="font-semibold text-ink">{display(peak.p!)}</b>
        <span className="text-ink-faint">（{fmtDate(peak.p!.hour)} {fmtTime(peak.p!.hour)}）</span>
        <span className="mx-1.5 text-ink-faint">·</span>
        近 24 小时变化{" "}
        <b className={"font-semibold " + (change === null ? "text-ink-faint" : change > 0 ? "text-risk" : "text-calm")}>
          {change === null ? "–" : `${change > 0 ? "+" : ""}${change}%`}
        </b>
      </p>
      <div className="relative mt-4 select-none" onPointerLeave={() => setActive(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-pan-y outline-none"
          role="img"
          aria-label={`热度走势：当前 ${display(last.p!)}，峰值 ${display(peak.p!)}`}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth={v === 0 ? 1.2 : 1} />
              <text x={PAD.l - 9} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-faint)" className="font-mono">{v}</text>
            </g>
          ))}
          <path d={area} fill="var(--color-brand)" fillOpacity={0.08} />
          <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {!cur && (
            <g>
              <circle cx={x(last.t)} cy={y(display(last.p!))} r="5" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="2" />
              <circle cx={x(last.t)} cy={y(display(last.p!))} r="2" fill="var(--color-brand)" />
            </g>
          )}
          {cur && (
            <g>
              <line x1={x(cur.t)} x2={x(cur.t)} y1={PAD.t} y2={base} stroke="var(--color-line-strong)" strokeDasharray="3 3" />
              <circle cx={x(cur.t)} cy={y(display(cur.p!))} r="5" fill="var(--color-surface)" stroke="var(--color-brand-deep)" strokeWidth="2" />
            </g>
          )}
          {labels.map((t, i) => (
            <text key={t} x={x(t)} y={base + 18} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-ink-faint)" className="font-mono">
              <tspan x={x(t)}>{fmtDate(new Date(t).toISOString())}</tspan>
              <tspan x={x(t)} dy="14">{fmtTime(new Date(t).toISOString())}</tspan>
            </text>
          ))}
        </svg>
        {cur && (
          <div className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] shadow-sm"
            style={{ left: `${Math.min(90, Math.max(10, (x(cur.t) / W) * 100))}%` }}>
            <div className="font-mono text-ink-faint">{fmtDate(cur.p!.hour)} {fmtTime(cur.p!.hour)}</div>
            <div className="text-ink-soft">
              热度 <b className="font-semibold text-ink">{display(cur.p!)}</b>
              <span className="mx-1 text-ink-faint">·</span>
              <span>{cur.p!.participants} 位参与者</span>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">趋势只比较持续完整观测到的时间段；移动指针可查看每小时热度与参与来源数。</p>
    </div>
  );
}
