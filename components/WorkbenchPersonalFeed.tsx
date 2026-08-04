"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Sparkles } from "lucide-react";
import { CONTENT_TYPES, type ContentItem, type ContentType } from "@/lib/esg-data-client";
import { getZonesByEventId } from "@/lib/zones-data";

interface PersonalPrefs {
  keyword: string;
  curatedOnly: boolean;
  contentType: "全部" | ContentType;
  source: string;
}

const DEFAULT_PREFS: PersonalPrefs = {
  keyword: "",
  curatedOnly: false,
  contentType: "全部",
  source: "全部",
};

const STORAGE_KEY = "esg-compass:workbench-feed-prefs";

const TYPE_STYLES: Record<string, string> = {
  "ESG 政策": "bg-info-soft text-info",
  "专家观点": "bg-violet-soft text-violet-note",
  "学术文章": "bg-calm-soft text-calm",
  "评级动态": "bg-paper text-ink-soft",
};

export default function WorkbenchPersonalFeed({ contents }: { contents: ContentItem[] }) {
  var [prefs, setPrefs] = useState<PersonalPrefs>(DEFAULT_PREFS);
  var [ready, setReady] = useState(false);

  useEffect(function () {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs(Object.assign({}, DEFAULT_PREFS, JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  useEffect(function () {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs, ready]);

  var sources = useMemo(function () {
    return Array.from(new Set(contents.map(function (c) { return c.sourceName; }))).sort();
  }, [contents]);

  var items = useMemo(function () {
    var q = prefs.keyword.trim().toLowerCase();
    return contents
      .filter(function (c) { return prefs.curatedOnly ? Boolean(c.recommended) : true; })
      .filter(function (c) { return prefs.contentType === "全部" || c.contentType === prefs.contentType; })
      .filter(function (c) { return prefs.source === "全部" || c.sourceName === prefs.source; })
      .filter(function (c) {
        if (!q) return true;
        return (c.title + " " + c.summary + " " + c.esgTopic).toLowerCase().includes(q);
      })
      .sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); });
  }, [contents, prefs]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 sm:col-span-2">
            <Search size={13} className="text-ink-faint" />
            <input value={prefs.keyword}
              onChange={function (e) { setPrefs(function (p) { return Object.assign({}, p, { keyword: e.target.value }); }); }}
              placeholder="在个人快讯中搜索…"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint" />
          </div>
          <button type="button"
            onClick={function () { setPrefs(function (p) { return Object.assign({}, p, { curatedOnly: !p.curatedOnly }); }); }}
            className={"inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors " + (prefs.curatedOnly ? "border-brand-line bg-brand-soft text-brand-deep" : "border-line bg-paper text-ink-soft hover:border-line-strong")}>
            <Sparkles size={12} />只看精选
          </button>
          <select value={prefs.contentType}
            onChange={function (e) { setPrefs(function (p) { return Object.assign({}, p, { contentType: e.target.value as PersonalPrefs["contentType"] }); }); }}
            className="rounded-md border border-line bg-paper px-2 py-2 text-[12px] text-ink-soft outline-none">
            <option value="全部">全部类型</option>
            {CONTENT_TYPES.map(function (t) { return <option key={t} value={t}>{t}</option>; })}
          </select>
          <select value={prefs.source}
            onChange={function (e) { setPrefs(function (p) { return Object.assign({}, p, { source: e.target.value }); }); }}
            className="rounded-md border border-line bg-paper px-2 py-2 text-[12px] text-ink-soft outline-none">
            <option value="全部">全部信源</option>
            {sources.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-faint">
          <span>匹配 {items.length} 条</span>
          <span>偏好自动保存至本机</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(function (c) {
          return (
            <div key={c.id} className="rounded-lg border border-line bg-surface p-4 transition-colors hover:border-brand-line">
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
                <span className={"rounded px-1.5 py-0.5 " + (TYPE_STYLES[c.contentType] || "bg-paper text-ink-soft")}>{c.contentType}</span>
                {c.recommended && <span className="rounded bg-brand px-1.5 py-0.5 text-surface">精选</span>}
                <span className="inline-flex items-center gap-0.5 text-ink-faint"><MapPin size={10} />{c.region}</span>
                <time className="ml-auto font-mono text-ink-faint">{c.publishedAt}</time>
              </div>
              <Link href={"/events/" + c.id} className="block">
                <h3 className="mb-1 text-[14px] font-semibold text-ink transition-colors hover:text-brand-deep">{c.title}</h3>
                <p className="mb-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{c.summary}</p>
              </Link>
              <div className="flex flex-wrap gap-1.5">
                {getZonesByEventId(c.id).map(function (z) {
                  return <span key={z.id} className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand-deep">{z.name}</span>;
                })}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-paper p-8 text-center text-[12px] text-ink-faint">当前偏好下没有匹配的 ESG 快讯，调整筛选条件再试试。</div>
        )}
      </div>
    </div>
  );
}