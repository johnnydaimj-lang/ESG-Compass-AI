"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { ContentItem } from "@/lib/esg-data";

const SASB_TOPICS = [
  "温室气体排放","气候风险","供应链管理","水资源管理",
  "人权与劳工","合规与监管","数据安全","社区关系",
  "废弃物管理","产品质量与安全",
];

export default function ReviewPage() {
  const [items, setItems] = useState<(ContentItem & { editing?: boolean })[]>([]);
  const load = async () => {
    const res = await fetch("/api/review");
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, fields: Partial<ContentItem>) => {
    const res = await fetch("/api/review", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
        <ArrowLeft size={14} />返回首页
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">AI 草稿审校</h1>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink-soft hover:bg-paper">
          <RefreshCw size={13} />刷新
        </button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">暂无待审校的 AI 草稿</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => <DraftEditor key={item.id} item={item} onSave={update} />)}
        </div>
      )}
    </div>
  );
}

function DraftEditor({ item, onSave }: { item: ContentItem; onSave: (id: string, fields: Partial<ContentItem>) => void }) {
  const [summary, setSummary] = useState(item.summary);
  const [esgTopic, setEsgTopic] = useState(item.esgTopic);
  const [importance, setImportance] = useState(item.importanceLevel);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px]">
        <span className="rounded bg-brand-soft px-1.5 py-0.5 text-brand-deep">AI 草稿</span>
        <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{item.contentType}</span>
        <span className="ml-auto text-ink-faint">{item.publishedAt}</span>
      </div>
      <h3 className="mb-3 text-[15px] font-semibold text-ink">{item.title}</h3>

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

      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mb-3 inline-flex items-center gap-1 text-[12px] text-brand-deep hover:underline">
        查看原文 &rarr;
      </a>

      <div className="flex justify-end">
        <button onClick={async () => { setSaving(true); await onSave(item.id, { summary, esgTopic, importanceLevel: importance }); setSaving(false); }}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
          确认并发布
        </button>
      </div>
    </div>
  );
}