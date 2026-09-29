import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Link from "next/link";
import { ArrowLeft, RadioTower, Wifi, WifiOff, AlertTriangle } from "lucide-react";

const SOURCES_FILE = resolve(process.cwd(), "data", "sources.json");

const CATEGORY_COLORS: Record<string, string> = {
  "可自动实现": "border-calm/30 bg-calm-soft text-calm",
  "需JS渲染": "border-info/30 bg-info-soft text-info",
  "需反爬代理": "border-warn/30 bg-warn-soft text-warn",
  "已失效": "border-risk/30 bg-risk-soft text-risk",
  "需人工清单": "border-violet-note/30 bg-violet-soft text-violet-note",
  "公众号自动抓取": "border-brand-line bg-brand-soft text-brand-deep",
};

interface Source {
  id: string;
  name: string;
  type: string;
  contentType: string;
  region: string;
  enabled: boolean;
  notes?: string;
  recoveryCategory?: string;
  recoveryPlan?: string;
}

export default function SourcesPage() {
  const raw = JSON.parse(readFileSync(SOURCES_FILE, "utf8")) as { sources: Source[] };
  const sources = raw.sources || [];
  const enabled = sources.filter((s) => s.enabled);
  const disabled = sources.filter((s) => !s.enabled);
  const categoryCount = disabled.reduce<Record<string, number>>((acc, s) => {
    const key = s.recoveryCategory || "未分类";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
          <ArrowLeft size={12} className="inline" />返回后台
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
          <RadioTower size={15} className="text-brand-deep" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink leading-tight">信源治理</h1>
          <p className="text-[11px] text-ink-faint">启用 {enabled.length} · 停用 {disabled.length} · 恢复路径按类别展示</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(categoryCount).map(([cat, count]) => (
          <div key={cat} className="rounded-lg border border-line bg-surface p-4">
            <div className={`mb-2 inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-medium ${CATEGORY_COLORS[cat] || "border-line bg-paper text-ink-soft"}`}>
              {cat === "已失效" ? <AlertTriangle size={12} /> : <RadioTower size={12} />}
              {cat}
            </div>
            <div className="text-2xl font-semibold tabular-nums text-ink">{count}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-paper/50">
              <th className="px-3 py-2.5 font-medium text-ink-faint">状态</th>
              <th className="px-3 py-2.5 font-medium text-ink-faint">信源</th>
              <th className="px-3 py-2.5 font-medium text-ink-faint">类型</th>
              <th className="px-3 py-2.5 font-medium text-ink-faint">地区</th>
              <th className="px-3 py-2.5 font-medium text-ink-faint">恢复分类</th>
              <th className="px-3 py-2.5 font-medium text-ink-faint">恢复路径</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src) => (
              <tr key={src.id} className="border-b border-line/50 last:border-0 hover:bg-paper/50">
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] ${src.enabled ? "text-calm" : "text-ink-faint"}`}>
                    {src.enabled ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {src.enabled ? "启用" : "停用"}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                  {src.name}
                  {src.notes && <span className="mt-0.5 block max-w-xs truncate text-[11px] font-normal text-ink-faint">{src.notes}</span>}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">{src.type}</td>
                <td className="px-3 py-2.5 text-ink-soft">{src.region}</td>
                <td className="px-3 py-2.5">
                  {src.recoveryCategory ? (
                    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[src.recoveryCategory] || "border-line bg-paper text-ink-soft"}`}>
                      {src.recoveryCategory}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft">{src.recoveryPlan || src.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
