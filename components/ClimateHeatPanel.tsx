"use client";

import { useEffect, useState } from "react";
import { HEAT_LOCATIONS, type HeatRecord, type HEAT_SOURCE } from "@/lib/climate-heat";

type Result = {
  status: "available";
  record: HeatRecord;
  summary: { baselineMean: number; futureMean: number; change: number; gridLatitude: number; gridLongitude: number };
  provenance: typeof HEAT_SOURCE;
} | { status: "unavailable"; message: string };
export default function ClimateHeatPanel({ latitude, longitude, scenario, window, onLocation }: {
  latitude: number; longitude: number; scenario: string; window: string;
  onLocation: (latitude: number, longitude: number) => void;
}) {
  const key = [latitude, longitude, scenario, window].join("|");
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ key: string; result?: Result; error?: string }>({ key: "" });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/public/climate-risk?" + new URLSearchParams({ lat: String(latitude), lon: String(longitude), scenario, window, variable: "tasmax" }), { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("无法读取高温数据，请稍后重试。"); return response.json(); })
      .then((result: Result) => setState({ key, result }))
      .catch((error) => { if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : "数据服务暂不可用" }); });
    return () => controller.abort();
  }, [key, latitude, longitude, scenario, window, retry]);
  const result = state.key === key ? state.result : undefined;
  const available = result?.status === "available" ? result : undefined;
  const maximum = available ? Math.max(1, available.summary.baselineMean, ...available.record.future.map((row) => row.hotDays)) : 1;
  return <section className="mt-4 rounded-lg border border-brand-line bg-surface p-4" aria-labelledby="heat-data-title">
    <h3 id="heat-data-title" className="text-sm font-semibold text-ink">日最高温超过35°C的天数</h3>
    <p className="mt-1 text-xs leading-relaxed text-ink-soft">NASA日最高温投影 · 同模型历史基准对比 · 单模型结果</p>
    <div className="mt-3 flex flex-wrap gap-2">{HEAT_LOCATIONS.map((location) => <button key={location.id} type="button" onClick={() => onLocation(location.latitude, location.longitude)} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-brand-deep hover:bg-brand-soft">{location.label}</button>)}</div>
    <div className="mt-3" aria-live="polite">
      {(!result && !state.error || state.key !== key) && <p className="text-xs text-ink-faint">正在读取所选网格的高温数据…</p>}
      {state.key === key && state.error && <div><p role="alert" className="text-xs text-warn">{state.error}</p><button type="button" onClick={() => { setState({ key: "" }); setRetry((value) => value + 1); }} className="mt-2 text-xs font-semibold text-brand-deep underline">重新读取</button></div>}
      {result?.status === "unavailable" && <p className="text-xs text-ink-soft">{result.message}</p>}
      {available && <>
        <div className="grid grid-cols-3 gap-2 rounded-md bg-brand-soft p-3">
          <div><p className="text-[10px] text-ink-faint">1995–2014历史模拟</p><strong className="mt-1 block font-mono text-lg text-ink">{available.summary.baselineMean.toFixed(1)}<span className="text-[10px]"> 天/年</span></strong></div>
          <div><p className="text-[10px] text-ink-faint">2041–2060投影</p><strong className="mt-1 block font-mono text-lg text-brand-deep">{available.summary.futureMean.toFixed(1)}<span className="text-[10px]"> 天/年</span></strong></div>
          <div><p className="text-[10px] text-ink-faint">年均变化</p><strong className="mt-1 block font-mono text-lg text-brand-deep">{available.summary.change > 0 ? "+" : ""}{available.summary.change.toFixed(1)}<span className="text-[10px]"> 天</span></strong></div>
        </div>
        <figure className="mt-3">
          <svg viewBox="0 0 360 155" role="img" aria-label="2041至2060逐年高温天数，虚线表示历史年均水平" className="block w-full">
            <text x="3" y="12" fontSize="9" fill="var(--color-ink-faint)">天/年 · {maximum}</text>
            <line x1="12" x2="348" y1="125" y2="125" stroke="var(--color-line)" />
            {available.record.future.map((row, index) => <rect key={row.year} x={15 + index * 16.4} y={125 - row.hotDays / maximum * 100} width="11" height={row.hotDays / maximum * 100} rx="2" fill="var(--color-brand)"><title>{row.year}年：{row.hotDays}天</title></rect>)}
            <line x1="12" x2="348" y1={125 - available.summary.baselineMean / maximum * 100} y2={125 - available.summary.baselineMean / maximum * 100} stroke="var(--color-ink-soft)" strokeDasharray="4 3" />
            <text x="12" y="144" fontSize="9" fill="var(--color-ink-faint)">2041</text><text x="320" y="144" fontSize="9" fill="var(--color-ink-faint)">2060</text>
          </svg>
          <figcaption className="text-[10px] text-ink-faint">柱形为逐年模拟值；虚线为历史年均值。年际变化不代表预测置信区间。</figcaption>
        </figure>
        <details className="mt-3 text-xs text-ink-soft"><summary className="cursor-pointer text-brand-deep">查看逐年数值</summary><dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">{available.record.future.map((row) => <div key={row.year} className="flex justify-between"><dt>{row.year}年</dt><dd>{row.hotDays}天</dd></div>)}</dl></details>
        <details className="mt-3 text-xs text-ink-soft"><summary className="cursor-pointer font-semibold text-brand-deep">查看数据来源与科学边界</summary><div className="mt-2 space-y-2 leading-relaxed">
          <p>{available.provenance.dataset} · {available.provenance.version} · {available.provenance.model} / {available.provenance.member} · {available.provenance.variable}（K转°C）。</p>
          <p>实际网格中心：{available.summary.gridLatitude}, {available.summary.gridLongitude}；分辨率{available.provenance.resolution}，不是厂界测量。当前输入：{latitude}, {longitude}。</p>
          <p>基准期与未来期各20年，完整日序列逐年计数后取均值。单模型成员未提供集合不确定性；35°C为明确的教学阈值，不是通用安全阈值，也不等于WBGT。</p>
          <p>气候投影与经营假设独立：这些天数不自动变为停工或货币损失。</p>
          <p>采集时间：{available.record.fetchedAt}。静态气候版本快照，不是实时天气。</p>
          <a className="text-brand-deep underline" href={available.provenance.sourceUrl} target="_blank" rel="noreferrer">NASA数据与获取方法</a>
        </div></details>
      </>}
    </div>
  </section>;
}
