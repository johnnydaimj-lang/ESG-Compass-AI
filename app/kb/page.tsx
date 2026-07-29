"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, ExternalLink, ChevronDown } from "lucide-react";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";

type Category = "全部" | "法规" | "标准" | "解读" | "实践";
var CATEGORIES: Category[] = ["全部", "法规", "标准", "解读"];

var CAT_COLORS: Record<string, string> = {
  法规: "bg-info-soft text-info border-info/30",
  标准: "bg-violet-soft text-violet-note border-violet-note/30",
  解读: "bg-calm-soft text-calm border-calm/30",
  实践: "bg-warn-soft text-warn border-warn/30",
};

export default function KBPage() {
  var [category, setCategory] = useState<Category>("全部");
  var [query, setQuery] = useState("");

  var filtered = useMemo(function () {
    var items = KNOWLEDGE_BASE;
    if (category !== "全部") items = items.filter(function (k) { return k.category === category; });
    if (query.trim()) {
      var q = query.toLowerCase();
      items = items.filter(function (k) {
        return k.title.toLowerCase().includes(q) ||
          k.summary.toLowerCase().includes(q) ||
          k.content.toLowerCase().includes(q) ||
          k.tags.some(function (t) { return t.includes(q); });
      });
    }
    return items;
  }, [category, query]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          <BookOpen size={22} className="inline align-text-top mr-2 text-brand-deep" />
          知识库
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          收录 ESG 法规原文、标准框架与专家解读。{KNOWLEDGE_BASE.length} 条条目，覆盖 {CATEGORIES.length - 1} 个分类。
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={query} onChange={function (e) { setQuery(e.target.value); }}
            placeholder="搜索知识库…"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-ink outline-none focus:border-brand-line placeholder:text-ink-faint" />
        </div>
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {CATEGORIES.map(function (c) {
            return (
              <button key={c} onClick={function () { setCategory(c); }}
                className={"rounded-md px-3 py-1.5 text-[12px] transition-colors " + (category === c ? "bg-brand font-medium text-surface" : "text-ink-soft hover:text-ink")}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* KB List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">未找到匹配条目</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(function (entry) {
            var catColor = CAT_COLORS[entry.category] || "bg-paper text-ink-soft border-line";
            return (
              <div key={entry.id} className="group rounded-lg border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={"rounded border px-2 py-0.5 text-[10px] font-medium " + catColor}>{entry.category}</span>
                  <span className="text-[11px] text-ink-faint">{entry.sourceName}</span>
                  <a href={entry.sourceUrl} target="_blank" rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[11px] text-brand-deep opacity-0 transition-opacity group-hover:opacity-100 hover:underline">
                    阅读原文 <ExternalLink size={10} />
                  </a>
                </div>
                <h2 className="mb-1.5 text-[15px] font-semibold leading-snug text-ink">{entry.title}</h2>
                <p className="mb-2 text-[13px] leading-relaxed text-ink-soft">{entry.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map(function (tag) {
                    return (
                      <span key={tag} className="rounded bg-paper px-1.5 py-0.5 text-[10px] text-ink-faint border border-line">
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="text-center text-[11px] text-ink-faint pt-2">共 {filtered.length} 条</div>
        </div>
      )}
    </div>
  );
}
