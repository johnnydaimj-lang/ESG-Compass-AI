"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save, Send, FileText, CheckCircle2, Clock } from "lucide-react";

interface InsightEntry {
  name: string;
  content: string;
}

interface InsightData {
  drafts: InsightEntry[];
  approved: InsightEntry[];
  published: InsightEntry[];
}

type GroupKey = "drafts" | "approved" | "published";

const GROUP_META: Record<GroupKey, { label: string; color: string; icon: typeof FileText }> = {
  drafts: { label: "待审阅", color: "bg-warn-soft text-warn", icon: Clock },
  approved: { label: "已确认", color: "bg-info-soft text-info", icon: CheckCircle2 },
  published: { label: "已发布", color: "bg-calm-soft text-calm", icon: FileText },
};

export default function MonthlyInsightsPage() {
  const [data, setData] = useState<InsightData>({ drafts: [], approved: [], published: [] });
  const [group, setGroup] = useState<GroupKey>("drafts");
  const [selectedName, setSelectedName] = useState("");
  const [content, setContent] = useState("");
  const [authError, setAuthError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setMessage("");
    try {
      const res = await fetch("/api/monthly-insights", { cache: "no-store" });
      if (res.status === 401) { setAuthError(true); return; }
      if (!res.ok) return;
      const next = await res.json() as InsightData;
      setData(next);
      const pool = next[group];
      if (!pool.some((e) => e.name === selectedName)) {
        const first = pool[0];
        setSelectedName(first?.name || "");
        setContent(first?.content || "");
      }
    } catch { /* keep current */ }
  }, [group, selectedName]);

  useEffect(() => { load(); }, [load]);

  function select(entry: InsightEntry) {
    setSelectedName(entry.name);
    setContent(entry.content);
    setMessage("");
  }

  async function save() {
    await send("save");
  }

  async function publish() {
    await send("publish");
  }

  async function send(action: "save" | "publish") {
    if (!selectedName || !content.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/monthly-insights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName, content, action }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(action === "publish" ? "已发布到 docs/monthly-insights" : "草稿已保存");
        setGroup(action === "publish" ? "approved" : "drafts");
        const nextRes = await fetch("/api/monthly-insights", { cache: "no-store" });
        const next = await nextRes.json() as InsightData;
        setData(next);
        const pool = next[action === "publish" ? "approved" : "drafts"];
        const entry = pool.find((e) => e.name === selectedName) || pool[0];
        setSelectedName(entry?.name || "");
        setContent(entry?.content || "");
      } else {
        setMessage(payload.error || "操作失败");
      }
    } finally {
      setBusy(false);
    }
  }

  const pool = data[group];
  const meta = GROUP_META[group];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
          <ArrowLeft size={12} className="inline" />返回后台
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
          <FileText size={15} className="text-brand-deep" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink leading-tight">月度主题洞察审阅</h1>
          <p className="text-[11px] text-ink-faint">先审阅草稿，确认后再发布到 docs/monthly-insights</p>
        </div>
        <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
          <RefreshCw size={13} />刷新
        </button>
      </div>

      {authError ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <p className="text-[13px] text-ink-soft">未授权，请先登录后台。</p>
          <Link href="/login" className="mt-3 inline-block rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface">前往登录</Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(Object.keys(GROUP_META) as GroupKey[]).map((key) => {
              const m = GROUP_META[key];
              const count = data[key].length;
              return (
                <button key={key} onClick={() => { setGroup(key); }} className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] transition-colors ${group === key ? "border-brand-line bg-brand-soft text-brand-deep" : "border-line bg-surface text-ink-soft hover:border-line-strong"}`}>
                  <m.icon size={12} />{m.label}
                  <span className="rounded bg-paper px-1.5 font-mono text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-2">
              {pool.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-8 text-center text-[12px] text-ink-faint">
                  {group === "drafts" ? "暂无待审阅洞察，等待月度任务生成" : group === "approved" ? "暂无已确认洞察" : "暂无已发布洞察"}
                </div>
              ) : pool.map((entry) => (
                <button key={entry.name} onClick={() => select(entry)} className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedName === entry.name ? "border-brand-line bg-brand-soft" : "border-line bg-surface hover:border-line-strong"}`}>
                  <span className="block truncate text-[12.5px] font-medium text-ink">{entry.name}</span>
                  <span className="text-[10px] text-ink-faint">{entry.content.length} 字</span>
                </button>
              ))}
            </aside>

            <section className="min-w-0 rounded-lg border border-line bg-surface p-4">
              {!selectedName ? (
                <div className="py-16 text-center text-[13px] text-ink-faint">选择一篇草稿开始审阅</div>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>
                      <meta.icon size={10} />{meta.label}
                    </span>
                    <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{selectedName}</h2>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={28}
                    className="w-full resize-y rounded-md border border-line bg-paper px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand-line"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    {message && <span className="mr-auto text-[11.5px] text-ink-soft">{message}</span>}
                    {group === "drafts" && (
                      <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-paper disabled:opacity-50">
                        <Save size={12} />保存草稿
                      </button>
                    )}
                    {group === "drafts" && (
                      <button onClick={publish} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
                        <Send size={12} />确认发布
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
