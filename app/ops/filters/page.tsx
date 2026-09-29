"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Save, RefreshCw, Settings2, Plus, X } from "lucide-react";

type FieldDef =
  | { type: "string-list"; label: string }
  | { type: "number"; label: string; min?: number; max?: number; step?: number }
  | { type: "boolean"; label: string }
  | { type: "text"; label: string }
  | { type: "textarea"; label: string }
  | { type: "select"; label: string; options: string[] }
  | { type: "object"; label: string; fields: Record<string, FieldDef> };

const SECTIONS: { key: string; label: string; desc: string; fields: Record<string, FieldDef> }[] = [
  {
    key: "junk",
    label: "垃圾与导航过滤",
    desc: "精确标题、标题正则、URL 正则、组织简介型摘要",
    fields: {
      exactTitles: { type: "string-list", label: "精确标题" },
      titlePatterns: { type: "string-list", label: "标题正则" },
      urlPatterns: { type: "string-list", label: "URL 正则" },
      boilerplatePatterns: { type: "string-list", label: "组织简介摘要正则" },
    },
  },
  {
    key: "esgRelevance",
    label: "ESG 相关性与中国贸易合规",
    desc: "强相关关键词、中国贸易政策词库、噪音模式",
    fields: {
      strongKeywords: { type: "string-list", label: "强相关关键词" },
      chinaTradeTerms: { type: "string-list", label: "中国贸易政策词库" },
      chinaTradeNoisePatterns: { type: "string-list", label: "噪音模式" },
    },
  },
  {
    key: "contentType",
    label: "内容类型判定",
    desc: "观点识别、仪式性讲话过滤、实质动作标记",
    fields: {
      expertOpinionPatterns: { type: "string-list", label: "观点正则" },
      speechCeremonyPatterns: { type: "string-list", label: "仪式性讲话正则" },
      substanceMarkers: { type: "string-list", label: "实质动作标记" },
    },
  },
  {
    key: "regulations",
    label: "法规关联规则",
    desc: "允许的内容类型与匹配模式",
    fields: {
      contentTypes: { type: "string-list", label: "内容类型" },
      matchMode: { type: "select", label: "匹配模式", options: ["zone-keywords-only"] },
    },
  },
  {
    key: "manualReview",
    label: "人工审阅分流",
    desc: "政治指控/反华叙事且来源不足时先进入后台；学术研究默认豁免",
    fields: {
      enabled: { type: "boolean", label: "启用分流" },
      academicExempt: { type: "boolean", label: "学术研究豁免" },
      minIndependentSources: { type: "number", label: "最低独立来源数" },
      politicalClaimPatterns: { type: "string-list", label: "政治指控识别正则" },
      learning: {
        type: "object",
        label: "审核结果学习",
        fields: {
          enabled: { type: "boolean", label: "启用学习" },
          repeatSourceRejectThreshold: { type: "number", label: "同源连续驳回阈值" },
          repeatSignalRejectThreshold: { type: "number", label: "同类信号驳回阈值" },
          signalTerms: { type: "string-list", label: "学习信号词" },
        },
      },
      reason: { type: "text", label: "进入审阅队列原因" },
    },
  },
  {
    key: "scoring",
    label: "评分权重与精选阈值",
    desc: "文本 / 媒体 / 学术评分权重与门槛",
    fields: {
      text: {
        type: "object",
        label: "文本精选",
        fields: {
          urgencyWeight: { type: "number", label: "紧迫性权重", step: 0.5 },
          breadthWeight: { type: "number", label: "广度权重", step: 0.5 },
          convertibilityWeight: { type: "number", label: "可转化性权重", step: 0.5 },
          impactWeight: { type: "number", label: "影响度权重", step: 0.5 },
          topicWeightDefault: { type: "number", label: "选题价值权重（默认）", step: 0.5 },
          topicWeightAcademic: { type: "number", label: "选题价值权重（学术）", step: 0.5 },
          curatedMinScore: { type: "number", label: "精选最低分", step: 0.5 },
          minImpact: { type: "number", label: "最低影响度", step: 0.5 },
        },
      },
      media: {
        type: "object",
        label: "媒体精选",
        fields: {
          relevanceWeight: { type: "number", label: "相关性权重", step: 0.5 },
          authorityWeight: { type: "number", label: "权威性权重", step: 0.5 },
          timelinessWeight: { type: "number", label: "时效性权重", step: 0.5 },
          convertibilityWeight: { type: "number", label: "可转化性权重", step: 0.5 },
          heatWeight: { type: "number", label: "热度权重", step: 0.5 },
          minRelevance: { type: "number", label: "最低相关性", step: 0.5 },
          curatedMinScore: { type: "number", label: "精选最低分", step: 0.5 },
        },
      },
      academic: {
        type: "object",
        label: "学术精选",
        fields: {
          minRelevance: { type: "number", label: "最低相关性", step: 0.05 },
          minPassScore: { type: "number", label: "最低通过分", step: 0.05 },
          curatedMinRelevance: { type: "number", label: "精选最低相关性", step: 0.05 },
          curatedMinScore: { type: "number", label: "精选最低分", step: 0.05 },
          weights: {
            type: "object",
            label: "权重",
            fields: {
              relevance: { type: "number", label: "相关性", step: 0.05 },
              journal: { type: "number", label: "期刊", step: 0.05 },
              citations: { type: "number", label: "引用", step: 0.05 },
              reads: { type: "number", label: "阅读", step: 0.05 },
            },
          },
        },
      },
    },
  },
  {
    key: "hotspot",
    label: "热点跟踪指标",
    desc: "热点发现与停止跟踪的指标阈值",
    fields: {
      minIndependentSources: { type: "number", label: "最少独立信源数" },
      minAuthoritativeSources: { type: "number", label: "最少权威源数" },
      minSecondarySources: { type: "number", label: "最少辅助源数" },
      detectionWindowHours: { type: "number", label: "发现窗口（小时）" },
      minImpactScore: { type: "number", label: "最低影响分", step: 0.5 },
      stopNoUpdateDays: { type: "number", label: "停止跟踪天数" },
      stopOnConsensus: { type: "boolean", label: "达成共识即进入收尾" },
    },
  },
  {
    key: "llm",
    label: "LLM 模型与提示词",
    desc: "模型、地址、温度、提示词版本与内容",
    fields: {
      model: { type: "text", label: "模型" },
      baseUrl: { type: "text", label: "API 地址" },
      temperature: { type: "number", label: "温度", step: 0.1 },
      promptVersion: { type: "number", label: "提示词版本" },
      structurePrompt: { type: "textarea", label: "结构化提示词" },
    },
  },
];

function StringListEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const items = Array.isArray(value) ? value : [];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center gap-1 rounded border border-line bg-paper px-2 py-1 text-[11px] text-ink-soft">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="rounded p-0.5 text-ink-faint transition-colors hover:text-risk">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const t = draft.trim(); if (t) { onChange([...items, t]); setDraft(""); } } }}
          placeholder="输入后回车添加"
          className="flex-1 rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line placeholder:text-ink-faint"
        />
        <button type="button" onClick={() => { const t = draft.trim(); if (t) { onChange([...items, t]); setDraft(""); } }}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-brand-line hover:text-brand-deep">
          <Plus size={12} />添加
        </button>
      </div>
    </div>
  );
}

function FieldEditor({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (def.type === "string-list") {
    return <StringListEditor value={(value as string[]) || []} onChange={(v) => onChange(v)} />;
  }
  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-[12px] text-ink-soft">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-line text-brand focus:ring-brand" />
        {def.label}
      </label>
    );
  }
  if (def.type === "select") {
    return (
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line">
        {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (def.type === "textarea") {
    return (
      <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={10}
        className="w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-[12px] leading-relaxed text-ink outline-none focus:border-brand-line" />
    );
  }
  if (def.type === "number") {
    return (
      <input type="number" value={Number(value ?? 0)} step={def.step} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line" />
    );
  }
  if (def.type === "object") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(def.fields).map(([key, child]) => (
          <div key={key} className={child.type === "object" ? "rounded-md border border-line bg-paper/50 p-3 sm:col-span-2" : ""}>
            <div className="mb-1 text-[11px] font-medium text-ink-soft">{child.label}</div>
            <FieldEditor def={child} value={(value as Record<string, unknown>)?.[key]} onChange={(v) => onChange({ ...(value as Record<string, unknown>), [key]: v })} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand-line" />
  );
}

export default function FiltersPage() {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/filters", { cache: "no-store" });
      if (res.status === 401) { setMessage({ type: "error", text: "未授权，请先登录" }); return; }
      const data = await res.json();
      setValues(data.rules || {});
    } catch {
      setMessage({ type: "error", text: "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: values }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setValues(data.rules || values);
        setMessage({ type: "ok", text: `规则已保存（v${data.rules?.version ?? "?"}），下一次管道运行生效` });
      } else {
        setMessage({ type: "error", text: data.error || `保存失败（HTTP ${res.status}）` });
      }
    } catch {
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">
            <ArrowLeft size={12} className="inline" />返回后台
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface">
            <Settings2 size={15} className="text-brand-deep" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">筛选规则与模型配置</h1>
            <p className="text-[11px] text-ink-faint">
              data/filter-rules.json · 规则版本 v{Number(values.version ?? 1)} · 保存后由下一次管道运行生效
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />重新加载
          </button>
          <button onClick={save} disabled={saving || loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}保存规则
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-[12px] ${message.type === "ok" ? "border-calm/30 bg-calm-soft text-calm" : "border-risk/30 bg-risk-soft text-risk"}`}>
          {message.type === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center text-[13px] text-ink-faint">加载中…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SECTIONS.map((section) => (
            <div key={section.key} className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-[13px] font-semibold text-ink">{section.label}</h2>
                <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">{section.key}</span>
              </div>
              <p className="mb-4 text-[11.5px] leading-relaxed text-ink-soft">{section.desc}</p>
              <div className="space-y-4">
                {Object.entries(section.fields).map(([key, def]) => (
                  <div key={key}>
                    <div className="mb-1 text-[11px] font-medium text-ink-soft">{def.label}</div>
                    <FieldEditor def={def} value={(values[section.key] as Record<string, unknown>)?.[key]}
                      onChange={(v) => setValues((prev) => ({ ...prev, [section.key]: { ...(prev[section.key] as Record<string, unknown>), [key]: v } }))} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
