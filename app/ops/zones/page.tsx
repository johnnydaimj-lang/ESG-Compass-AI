"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Save, Loader2, Layers,
  CalendarRange, Tags, Link2, CheckCircle2, AlertTriangle
} from "lucide-react";

interface Milestone { date: string; title: string; summary: string; }
interface Zone {
  id: string; name: string; description: string;
  eventIds: string[]; keywords: string[]; milestones: Milestone[];
}

function blankMilestone(): Milestone { return { date: "", title: "", summary: "" }; }

function splitList(text: string): string[] {
  return text.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
}

function ZoneForm({ initial, onClose, onSaved }: {
  initial: Zone | null; onClose: () => void; onSaved: (zone: Zone) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [eventIds, setEventIds] = useState((initial?.eventIds || []).join(", "));
  const [keywords, setKeywords] = useState((initial?.keywords || []).join(", "));
  const [milestones, setMilestones] = useState<Milestone[]>(initial?.milestones?.length ? initial.milestones : [blankMilestone()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateMilestone(index: number, field: keyof Milestone, value: string) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) { setError("专区名称必填"); return; }
    setSaving(true);
    const payload = {
      name: trimmedName,
      description: description.trim(),
      eventIds: splitList(eventIds),
      keywords: splitList(keywords),
      milestones: milestones
        .filter((m) => m.date || m.title || m.summary)
        .map((m) => ({ date: m.date.trim(), title: m.title.trim(), summary: m.summary.trim() })),
    };
    try {
      const res = await fetch(initial ? `/api/zones/${initial.id}` : "/api/zones", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onSaved(data.zone);
      } else {
        setError(data.error || `保存失败（HTTP ${res.status}）`);
      }
    } catch {
      setError("网络错误，保存失败");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-lg border border-line-strong bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-brand-deep" />
            <h2 className="text-[15px] font-semibold text-ink">{initial ? "编辑专区" : "新增专区"}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">专区名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：碳市场与碳定价"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="一句话说明该专区的关注范围"
              className="w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-ink-soft">
              <Link2 size={12} />关联事件 ID <span className="font-normal text-ink-faint">（逗号分隔）</span>
            </label>
            <input value={eventIds} onChange={(e) => setEventIds(e.target.value)}
              placeholder="例如：m-eu-csddd, m-eu-cbam"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-ink-soft">
              <Tags size={12} />自动聚合关键词 <span className="font-normal text-ink-faint">（逗号分隔，用于首页自动归类）</span>
            </label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：carbon, carbon market, 碳市场, cbam"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="flex items-center gap-1 text-[12px] font-medium text-ink-soft">
                <CalendarRange size={12} />关键里程碑
              </label>
              <button type="button" onClick={() => setMilestones((prev) => [...prev, blankMilestone()])}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-[11px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep">
                <Plus size={11} />添加一行
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="rounded-md border border-line bg-paper p-2.5">
                  <div className="mb-2 flex items-center gap-2">
                    <input value={m.date} onChange={(e) => updateMilestone(i, "date", e.target.value)} placeholder="2026-01-01"
                      className="w-32 rounded border border-line bg-surface px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-brand-line" />
                    <input value={m.title} onChange={(e) => updateMilestone(i, "title", e.target.value)} placeholder="里程碑标题"
                      className="flex-1 rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line" />
                    {milestones.length > 1 && (
                      <button type="button" onClick={() => setMilestones((prev) => prev.filter((_, j) => j !== i))}
                        className="rounded p-1 text-ink-faint transition-colors hover:text-risk">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <textarea value={m.summary} onChange={(e) => updateMilestone(i, "summary", e.target.value)} rows={2}
                    placeholder="里程碑说明（可选）"
                    className="w-full resize-none rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line" />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 rounded-md border border-risk/30 bg-risk-soft px-3 py-2 text-[12px] text-risk">
              <AlertTriangle size={13} />{error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-md border border-line px-3 py-2 text-[12px] text-ink-soft transition-colors hover:bg-paper">
              取消
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {initial ? "保存修改" : "创建专区"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OpsZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zones", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
      }
    } catch { /* keep current list */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingZone(null);
    setFormOpen(true);
  }

  function openEdit(zone: Zone) {
    setEditingZone(zone);
    setFormOpen(true);
  }

  function showMessage(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  }

  async function removeZone(zone: Zone) {
    if (!window.confirm(`确认删除专区「${zone.name}」？删除后不可恢复。`)) return;
    try {
      const res = await fetch(`/api/zones/${zone.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showMessage("ok", `已删除「${zone.name}」`);
        load();
      } else {
        showMessage("error", data.error || `删除失败（HTTP ${res.status}）`);
      }
    } catch {
      showMessage("error", "网络错误，删除失败");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
            <ArrowLeft size={12} className="inline" />返回后台
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
            <Layers size={15} className="text-brand-deep" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">专区管理</h1>
            <p className="text-[11px] text-ink-faint">新增 / 编辑 / 删除知识专区，并配置关联事件与自动聚合关键词</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep">
          <Plus size={13} />新增专区
        </button>
      </div>

      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-[12px] ${message.type === "ok" ? "border-calm/30 bg-calm-soft text-calm" : "border-risk/30 bg-risk-soft text-risk"}`}>
          {message.type === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-[13px] text-ink-faint">加载中…</div>
      ) : zones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <p className="text-[13px] text-ink-faint">还没有专区，点击右上角“新增专区”创建第一个。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="divide-y divide-line">
            {zones.map((zone) => (
              <div key={zone.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/zones/${zone.id}`} target="_blank"
                      className="text-[14px] font-semibold text-ink transition-colors hover:text-brand-deep">
                      {zone.name}
                    </Link>
                    <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">{zone.id}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{zone.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-faint">
                    <span className="rounded border border-line bg-paper px-1.5 py-0.5">{zone.eventIds.length} 个手动关联事件</span>
                    <span className="rounded border border-line bg-paper px-1.5 py-0.5">{zone.milestones.length} 个里程碑</span>
                    <span className="rounded border border-line bg-paper px-1.5 py-0.5">{zone.keywords.length} 个聚合关键词</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => openEdit(zone)}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11.5px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep">
                    <Pencil size={12} />编辑
                  </button>
                  <button onClick={() => removeZone(zone)}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11.5px] text-ink-soft transition-colors hover:border-risk/40 hover:text-risk">
                    <Trash2 size={12} />删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <ZoneForm
          initial={editingZone}
          onClose={() => setFormOpen(false)}
          onSaved={(zone) => {
            setFormOpen(false);
            showMessage("ok", editingZone ? `已更新「${zone.name}」` : `已创建「${zone.name}」`);
            load();
          }}
        />
      )}
    </div>
  );
}
