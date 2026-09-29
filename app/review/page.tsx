"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RefreshCw, ShieldAlert, X } from "lucide-react";
import { getContentLink, type ContentItem } from "@/lib/esg-data-client";

const SASB_TOPICS = [
  "温室气体排放","气候风险","供应链管理","水资源管理",
  "人权与劳工","合规与监管","数据安全","社区关系",
  "废弃物管理","产品质量与安全",
];

type QueueItem = ContentItem & {
  reviewReason?: string;
  reviewRule?: string;
  reviewQueuedAt?: string;
  reviewPriority?: string;
};

type DecisionRecord = {
  id: string;
  title: string;
  action: "approve" | "reject";
  decidedAt: string;
};

export default function ReviewPage() {
  const [drafts, setDrafts] = useState<ContentItem[]>([]);
  const [pending, setPending] = useState<QueueItem[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [learning, setLearning] = useState({ updatedAt: "", recommendations: 0 });
  const [authError, setAuthError] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => {
    const res = await fetch("/api/review");
    if (res.status === 401) { setAuthError(true); return; }
    setAuthError(false);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setDrafts(data);
        setPending([]);
        setApprovedCount(0);
        setRejectedCount(0);
        setDecisions([]);
        setLearning({ updatedAt: "", recommendations: 0 });
      } else {
        setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
        setPending(Array.isArray(data.pending) ? data.pending : []);
        setApprovedCount(Number(data.approvedCount || 0));
        setRejectedCount(Number(data.rejectedCount || 0));
        setDecisions(Array.isArray(data.decisions) ? data.decisions : []);
        setLearning({
          updatedAt: String(data.learning?.updatedAt || ""),
          recommendations: Number(data.learning?.recommendations || 0),
        });
      }
    }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, fields: Partial<ContentItem>, action?: "approve" | "reject") => {
    setMessage("");
    const res = await fetch("/api/review", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...fields }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (action === "approve" || action === "reject") {
        setPending((prev) => prev.filter((i) => i.id !== id));
        const saved = action === "approve" ? "已批准公开，并写入批准库。" : "已驳回，并写入驳回库。";
        const translation = action === "approve" ? (data.translationUpdated ? " 中文翻译已补齐。" : " 中文翻译将在下次管道运行时补齐。") : "";
        setMessage(`${saved}${data.learningUpdated ? " 筛选学习已更新。" : " 筛选学习将在下次管道运行时刷新。"}${translation}`);
        await load();
      } else {
        setDrafts((prev) => prev.filter((i) => i.id !== id));
      }
    } else if (res.status === 401) {
      setAuthError(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || `操作失败（HTTP ${res.status}）`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
        <ArrowLeft size={14} />返回首页
      </Link>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">后台审阅</h1>
          <p className="mt-1 text-[12px] text-ink-faint">待核实内容不会进入公开前台；批准后才发布。</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink-soft hover:bg-paper">
          <RefreshCw size={13} />刷新
        </button>
      </div>
      {message && <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3 text-[12px] text-ink-soft">{message}</div>}
      {authError ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <p className="text-[13px] text-ink-soft">未授权，请先登录后再审校。</p>
          <Link href="/login" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep">
            前往登录
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">审阅归档</h2>
              <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-ink-faint">临时保留</span>
              <span className="ml-auto text-[11px] text-ink-faint">
                学习建议 {learning.recommendations}{learning.updatedAt ? ` · ${learning.updatedAt.slice(0, 10)}` : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <div className="text-[11px] text-ink-faint">批准库</div>
                <div className="mt-1 text-xl font-semibold text-ink">{approvedCount}</div>
              </div>
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <div className="text-[11px] text-ink-faint">驳回库</div>
                <div className="mt-1 text-xl font-semibold text-ink">{rejectedCount}</div>
              </div>
            </div>
            {decisions.length > 0 && (
              <div className="mt-3 divide-y divide-line rounded-md border border-line bg-surface">
                {decisions.map((record) => (
                  <div key={`${record.id}-${record.decidedAt}`} className="flex items-center gap-3 px-3 py-2.5 text-[12px]">
                    <span className={record.action === "approve" ? "text-calm" : "text-risk"}>
                      {record.action === "approve" ? "批准" : "驳回"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink-soft">{record.title}</span>
                    <span className="shrink-0 text-[10.5px] text-ink-faint">{String(record.decidedAt || "").slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">待核实内容</h2>
              <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-ink-faint">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-8 text-center text-[13px] text-ink-faint">暂无待核实内容</div>
            ) : (
              <div className="space-y-4">
                {pending.map((item) => (
                  <ReviewEditor
                    key={item.id}
                    item={item}
                    pending
                    onSave={(id, fields) => update(id, fields)}
                    onApprove={(id, fields) => update(id, fields, "approve")}
                    onReject={(id, fields) => update(id, fields, "reject")}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">AI 草稿审校</h2>
              <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-ink-faint">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-8 text-center text-[13px] text-ink-faint">暂无待审校的 AI 草稿</div>
            ) : (
              <div className="space-y-4">
                {drafts.map((item) => (
                  <ReviewEditor key={item.id} item={item} onSave={(id, fields) => update(id, fields)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ReviewEditor({
  item,
  pending = false,
  onSave,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  pending?: boolean;
  onSave: (id: string, fields: Partial<ContentItem>) => void;
  onApprove?: (id: string, fields: Partial<ContentItem>) => void;
  onReject?: (id: string, fields: Partial<ContentItem>) => void;
}) {
  const [summary, setSummary] = useState(item.summary);
  const [esgTopic, setEsgTopic] = useState(item.esgTopic);
  const [importance, setImportance] = useState(item.importanceLevel);
  const [saving, setSaving] = useState(false);
  const fields = { summary, esgTopic, importanceLevel: importance } as Partial<ContentItem>;

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${pending ? "bg-risk-soft text-risk" : "bg-brand-soft text-brand-deep"}`}>
          {pending && <ShieldAlert size={11} />}
          {pending ? "待人工核实" : "AI 草稿"}
        </span>
        <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{item.contentType}</span>
        {pending && item.reviewPriority === "high" && (
          <span className="rounded bg-risk-soft px-1.5 py-0.5 text-risk">历史高风险</span>
        )}
        <span className="ml-auto text-ink-faint">{item.publishedAt}</span>
      </div>
      <h3 className="mb-3 text-[15px] font-semibold text-ink">{item.title}</h3>
      {pending && item.reviewReason && (
        <div className="mb-4 rounded-md border border-risk/20 bg-risk-soft/45 px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft">
          {item.reviewReason}
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1 block text-[11px] text-ink-faint">摘要</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-0 focus:border-brand-line" />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-ink-faint">ESG 议题</label>
          <select value={esgTopic} onChange={(e) => setEsgTopic(e.target.value)}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-0 focus:border-brand-line">
            {SASB_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-faint">重要性</label>
          <select value={importance} onChange={(e) => setImportance(e.target.value as any)}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-0 focus:border-brand-line">
            <option value="高">高</option><option value="中">中</option><option value="低">低</option>
          </select>
        </div>
      </div>

      <a href={getContentLink(item)} target="_blank" rel="noreferrer" className="mb-3 inline-flex items-center gap-1 text-[12px] text-brand-deep hover:underline">
        查看原文 &rarr;
      </a>

      <div className="flex justify-end">
        {pending ? (
          <div className="flex gap-2">
            <button onClick={async () => { setSaving(true); await onReject?.(item.id, fields); setSaving(false); }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-risk/40 hover:text-risk disabled:opacity-50">
              <X size={13} />驳回
            </button>
            <button onClick={async () => { setSaving(true); await onApprove?.(item.id, fields); setSaving(false); }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
              <Check size={13} />批准公开
            </button>
          </div>
        ) : (
          <button onClick={async () => { setSaving(true); await onSave(item.id, fields); setSaving(false); }}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
            保存修正
          </button>
        )}
      </div>
    </div>
  );
}
