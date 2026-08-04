"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, RefreshCw, Search } from "lucide-react";

interface KbEntry {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  category: string;
  scope: "公开" | "私密";
}

export default function WorkbenchKnowledgeBase() {
  var [entries, setEntries] = useState<KbEntry[]>([]);
  var [privateDir, setPrivateDir] = useState("");
  var [query, setQuery] = useState("");
  var [category, setCategory] = useState("全部");
  var [selectedId, setSelectedId] = useState("");
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");

  var load = useCallback(function () {
    setLoading(true);
    setError("");
    fetch("/api/workbench/kb", { cache: "no-store" })
      .then(function (res) { if (!res.ok) throw new Error("unauthorized"); return res.json(); })
      .then(function (data) {
        var list: KbEntry[] = [];
        (data.publicEntries || []).forEach(function (e: any) { list.push(Object.assign({}, e, { scope: "公开" })); });
        (data.privateEntries || []).forEach(function (e: any) { list.push(Object.assign({}, e, { scope: "私密" })); });
        setEntries(list);
        setPrivateDir(data.privateDir || "");
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(function () { setError("无法读取知识库，请确认已登录并检查本地私密目录。"); })
      .finally(function () { setLoading(false); });
  }, []);

  useEffect(function () { load(); }, [load]);

  var categories = useMemo(function () {
    var cats = Array.from(new Set(entries.map(function (e) { return e.category; }))).sort();
    return ["全部"].concat(cats);
  }, [entries]);

  var filtered = useMemo(function () {
    var q = query.trim().toLowerCase();
    return entries.filter(function (e) {
      if (category !== "全部" && e.category !== category) return false;
      if (!q) return true;
      return (e.title + " " + e.summary + " " + e.content).toLowerCase().includes(q);
    });
  }, [entries, query, category]);

  var selected = entries.find(function (e) { return e.id === selectedId; }) || filtered[0] || null;
  var publicCount = entries.filter(function (e) { return e.scope === "公开"; }).length;
  var privateCount = entries.length - publicCount;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-paper px-3 py-2">
            <Search size={13} className="text-ink-faint" />
            <input value={query} onChange={function (e) { setQuery(e.target.value); }}
              placeholder="搜索公开标准与私密资料…"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint" />
          </div>
          <select value={category} onChange={function (e) { setCategory(e.target.value); }}
            className="rounded-md border border-line bg-paper px-2 py-2 text-[12px] text-ink-soft outline-none">
            {categories.map(function (c) { return <option key={c} value={c}>{c === "全部" ? "全部分类" : c}</option>; })}
          </select>
          <button type="button" onClick={load} disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-3 py-2 text-[12px] text-ink-soft transition-colors hover:border-line-strong">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />刷新
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-faint">
          <span>共 {entries.length} 条 · 公开 {publicCount} · 私密 {privateCount}</span>
          <span>私密目录：{privateDir || "data/private-kb"}</span>
        </div>
      </div>

      {error && <div className="rounded-lg border border-line bg-risk-soft p-3 text-[12px] text-risk">{error}</div>}
      {privateCount === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-line bg-paper p-4 text-[12px] text-ink-soft">
          <div className="mb-1 flex items-center gap-1 font-medium text-ink"><BookOpen size={12} />本地私密知识库为空</div>
          <p>将 Markdown 放入 <code>{privateDir || "data/private-kb"}</code>，或设置环境变量 <code>PRIVATE_KB_DIR</code> 指向 Obsidian 仓库后刷新。</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
          {filtered.map(function (e) {
            var isSelected = e.id === selected?.id;
            return (
              <button key={e.id} type="button" onClick={function () { setSelectedId(e.id); }}
                className={"w-full rounded-lg border bg-surface p-3 text-left transition-colors " + (isSelected ? "border-brand-line bg-brand-soft" : "border-line hover:border-line-strong")}>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className={"rounded px-1.5 py-0.5 " + (e.scope === "私密" ? "bg-violet-soft text-violet-note" : "bg-info-soft text-info")}>{e.scope}</span>
                  <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{e.category}</span>
                </div>
                <div className="mb-1 text-[13px] font-semibold text-ink">{e.title}</div>
                <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{e.summary}</p>
              </button>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-[12px] text-ink-faint">没有匹配的知识库条目</div>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface p-4">
          {selected ? (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className={"rounded px-1.5 py-0.5 " + (selected.scope === "私密" ? "bg-violet-soft text-violet-note" : "bg-info-soft text-info")}>{selected.scope}</span>
                <span className="rounded bg-paper px-1.5 py-0.5 text-ink-soft">{selected.category}</span>
                {selected.sourceUrl && (
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-0.5 text-ink-soft hover:text-brand-deep">来源<ExternalLink size={10} /></a>
                )}
              </div>
              <h2 className="mb-2 text-[15px] font-semibold text-ink">{selected.title}</h2>
              <p className="mb-3 text-[11px] text-ink-faint">{selected.sourceName}</p>
              <div className="max-h-[380px] overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-3 text-[12.5px] leading-relaxed text-ink-soft">{selected.content}</div>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-center text-[12px] text-ink-faint">选择左侧条目查看详情</div>
          )}
        </div>
      </div>
    </div>
  );
}