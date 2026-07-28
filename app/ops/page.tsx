"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, RefreshCw, Play, ExternalLink,
  CheckCircle, XCircle, Clock, Server, FileText, Star, Globe,
  ArrowUpRight, Wifi, WifiOff, ChevronRight
} from "lucide-react";
import { ROADMAP } from "@/lib/roadmap";

// ── 类型 ──────────────────────────────────────────────
interface SourceHealth {
  id: string; name: string; type: string; contentType: string; region: string;
  enabled: boolean; lastFetchAt: string | null; successCount: number;
  failCount: number; todayCount: number;
  health: "healthy" | "degraded" | "stale";
}

interface PipelineStats {
  todayFetched: number; todayLlmProcessed: number; todayCurated: number;
  todayPublished: number; lastPipelineRun: string | null;
  totalSources: number; enabledSources: number;
  degradedSources: number; staleSources: number;
}

interface AnomalyEntry {
  id: string; timestamp: string;
  type: "source_failure" | "llm_error" | "network_error" | "warning";
  sourceName: string; message: string; resolved: boolean;
}

// ── 帮助 ──────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = { rss: "RSS", webpage: "网页" };

function contentTypeBadge(ct: string) {
  const colors: Record<string, string> = {
    'ESG 政策': 'bg-brand-soft text-brand-deep',
    "专家观点": "bg-calm-soft text-calm",
    "学术文章": "bg-violet-soft text-violet-note",
    "评级动态": "bg-warn-soft text-warn",
  };
  return colors[ct] || "bg-ink-faint/10 text-ink-soft";
}

function healthIcon(health: string, enabled: boolean) {
  if (!enabled) return <WifiOff size={13} className="text-ink-faint" />;
  if (health === "healthy") return <Wifi size={13} className="text-calm" />;
  if (health === "degraded") return <AlertTriangle size={13} className="text-warn" />;
  return <XCircle size={13} className="text-risk" />;
}

function healthLabel(health: string, enabled: boolean) {
  if (!enabled) return "已停用";
  if (health === "healthy") return "正常";
  if (health === "degraded") return "异常";
  return "失联";
}

function healthColor(health: string, enabled: boolean) {
  if (!enabled) return "text-ink-faint";
  if (health === 'healthy') return 'text-calm';
  if (health === "degraded") return "text-warn";
  return "text-risk";
}

function anomIcon(type: string) {
  if (type === "source_failure") return <Server size={13} className="text-risk shrink-0" />;
  if (type === "llm_error") return <FileText size={13} className="text-warn shrink-0" />;
  if (type === "warning") return <AlertTriangle size={13} className="text-warn shrink-0" />;
  return <Activity size={13} className="text-info shrink-0" />;
}

// ── 统计卡片 ──────────────────────────────────────────
function MetricCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string;
  sub?: string; color?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-ink-faint uppercase tracking-wide">
        {icon}{label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${color || "text-ink"}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-ink-faint">{sub}</div>}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────
export default function OpsDashboard() {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [now] = useState(() => {
    const d = new Date();
    var y=d.getFullYear(),mo=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0'),h=String(d.getHours()).padStart(2,'0'),mi=String(d.getMinutes()).padStart(2,'0'); return y+'-'+mo+'-'+da+' '+h+':'+mi;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources);
        setPipeline(data.pipeline);
        setAnomalies(data.anomalies);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
            <Activity size={15} className="text-ink-soft" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">Ops Dashboard</h1>
            <p className="text-[11px] text-ink-faint leading-tight">{now}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            刷新
          </button>
          <Link
            href="/review"
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand-deep transition-colors hover:bg-brand-line"
          >
            <ExternalLink size={13} />
            前往审校
          </Link>
        </div>
      </div>

      {/* Pipeline Stats */}
      {pipeline && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            icon={<Globe size={13} />}
            label="今日抓取"
            value={pipeline.todayFetched}
            sub={`${pipeline.enabledSources}/${pipeline.totalSources} 信源在线`}
          />
          <MetricCard
            icon={<FileText size={13} />}
            label="LLM 处理"
            value={pipeline.todayLlmProcessed}
          />
          <MetricCard
            icon={<Star size={13} />}
            label="精选"
            value={pipeline.todayCurated}
            color="text-brand-deep"
          />
          <MetricCard
            icon={<CheckCircle size={13} />}
            label="已发布"
            value={pipeline.todayPublished}
            sub={`${pipeline.degradedSources} 异常 · ${pipeline.staleSources} 失联`}
          />
        </div>
      )}

      {/* Pipeline Controls */}
      <div className="mb-6 rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock size={14} className="text-ink-faint shrink-0" />
            <span className="text-[13px] text-ink-soft">
              上次管道运行：<span className="font-mono text-ink">{pipeline?.lastPipelineRun ?? "—"}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTriggering(true);
                // 模拟触发管道（占位）
                setTimeout(() => setTriggering(false), 2000);
              }}
              disabled={triggering}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              <Play size={13} className={triggering ? "animate-pulse" : ""} />
              {triggering ? "运行中…" : "手动触发"}
            </button>
            <Link
              href="/review"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-paper"
            >
              待审校草稿
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Source Health Table */}
      <div className="mb-6">
        <h2 className="mb-3 text-[13px] font-semibold text-ink tracking-wide uppercase">
          信源状态
          <span className="ml-2 text-[11px] font-normal text-ink-faint">
            {sources.filter((s) => s.enabled).length} 启用 · {sources.filter((s) => !s.enabled).length} 停用
          </span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="px-3 py-2.5 font-medium text-ink-faint">状态</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint">信源</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint">类型</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint">类别</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint">最后抓取</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint text-right">成功</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint text-right">失败</th>
                <th className="px-3 py-2.5 font-medium text-ink-faint text-right">今日产出</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} className="border-b border-line/50 last:border-0 hover:bg-paper/50">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {healthIcon(src.health, src.enabled)}
                      <span className={`text-[11px] ${healthColor(src.health, src.enabled)}`}>
                        {healthLabel(src.health, src.enabled)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                    {src.name}
                    {!src.enabled && <span className="ml-2 text-[11px] text-ink-faint">(停用)</span>}
                    {src.region === "全球" && (
                      <Globe size={11} className="ml-1.5 inline text-ink-faint" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">
                    {TYPE_LABELS[src.type] || src.type}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${contentTypeBadge(src.contentType)}`}>
                      {src.contentType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-ink-soft whitespace-nowrap">
                    {src.lastFetchAt ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink tabular-nums">
                    {src.successCount}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                    src.failCount > 0 ? "text-risk" : "text-ink-soft"
                  }`}>
                    {src.failCount}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink tabular-nums">
                    {src.todayCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomaly Log */}
      <div className="mb-6">
        <h2 className="mb-3 text-[13px] font-semibold text-ink tracking-wide uppercase">
          异常记录
          <span className="ml-2 text-[11px] font-normal text-ink-faint">
            {anomalies.filter((a) => !a.resolved).length} 未处理
          </span>
        </h2>
        {anomalies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-8 text-center">
            <CheckCircle size={20} className="mx-auto mb-2 text-calm" />
            <p className="text-[13px] text-ink-faint">暂无异常记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                  anom.resolved
                    ? "border-line bg-surface/50"
                    : "border-line-strong bg-surface"
                }`}
              >
                {anomIcon(anom.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-medium text-ink">{anom.sourceName}</span>
                    {anom.resolved ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-calm-soft px-1.5 py-0.5 text-[10px] text-calm">已处理</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded bg-risk-soft px-1.5 py-0.5 text-[10px] text-risk">待处理</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-soft leading-normal">{anom.message}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink-faint">{anom.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roadmap */}
      <div className="mb-6">
        <h2 className="mb-3 text-[13px] font-semibold text-ink tracking-wide uppercase">
          功能路线图
          <span className="ml-2 text-[11px] font-normal text-ink-faint">
            {ROADMAP.filter(function (r) { return r.category !== "已完成"; }).length} 项未完成 · {ROADMAP.filter(function (r) { return r.category === "已完成"; }).length} 项已完成
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROADMAP.map(function (item) {
            var catColor = "";
            if (item.category === "已完成") catColor = "border-calm/30 bg-calm-soft/50";
            else if (item.category === "进行中") catColor = "border-info/30 bg-info-soft/50";
            else if (item.category === "待开始") catColor = "border-warn/30 bg-warn-soft/50";
            else catColor = "border-line bg-surface";

            var catDot = "";
            if (item.category === "已完成") catDot = "text-calm";
            else if (item.category === "进行中") catDot = "text-info";
            else if (item.category === "待开始") catDot = "text-warn";
            else catDot = "text-ink-faint";

            var prioLabel = "";
            if (item.priority === "P0") prioLabel = "bg-risk-soft text-risk";
            else if (item.priority === "P1") prioLabel = "bg-warn-soft text-warn";
            else if (item.priority === "P2") prioLabel = "bg-info-soft text-info";
            else prioLabel = "bg-paper text-ink-faint";

            return (
              <div key={item.id} className={"rounded-lg border px-4 py-3 " + catColor}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={"text-[10px] " + catDot}>&#x25CF;</span>
                      <span className="text-[13px] font-medium text-ink">{item.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">{item.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={"rounded px-1.5 py-0.5 text-[10px] font-medium " + prioLabel}>{item.priority}</span>
                    <span className="text-[10px] text-ink-faint">{item.category}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-line pt-4 text-center text-[11px] text-ink-faint">
        ESG Compass · 运营看板 · 后端管道配置在 <code className="font-mono text-ink-soft">scripts/pipeline.mjs</code>
      </div>
    </div>
  );
}
