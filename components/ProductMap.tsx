"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";
import { PRODUCT_MAP, type MapNode } from "@/lib/product-map";

const BRANCH_COLORS = [
  { bar: "bg-brand", chip: "bg-brand-soft text-brand-deep", ring: "border-brand/40" },
  { bar: "bg-info", chip: "bg-info-soft text-info", ring: "border-info/40" },
  { bar: "bg-calm", chip: "bg-calm-soft text-calm", ring: "border-calm/40" },
  { bar: "bg-violet-note", chip: "bg-violet-soft text-violet-note", ring: "border-violet-note/40" },
  { bar: "bg-warn", chip: "bg-warn-soft text-warn", ring: "border-warn/40" },
  { bar: "bg-risk", chip: "bg-risk-soft text-risk", ring: "border-risk/40" },
  { bar: "bg-ink", chip: "bg-paper text-ink", ring: "border-line-strong" },
];

function TreeNode({ node, depth, branchIdx }: {
  node: MapNode;
  depth: number;
  branchIdx: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = !!node.children && node.children.length > 0;
  const color = BRANCH_COLORS[branchIdx % BRANCH_COLORS.length];

  return (
    <div className="relative">
      <div className="flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-brand-soft/30">
        <div className={"mt-1.5 h-5 w-1 shrink-0 rounded-full " + color.bar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => setOpen((v) => !v)}
                className="rounded p-0.5 text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-deep"
                title={open ? "折叠" : "展开"}
              >
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <FileText size={12} className="ml-0.5 shrink-0 text-ink-faint" />
            )}
            <span className="text-[13px] font-medium leading-snug text-ink">{node.label}</span>
          </div>
          {node.detail && (
            <p className="ml-6 mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">{node.detail}</p>
          )}
        </div>
      </div>
      {hasChildren && open && (
        <div className="ml-5 border-l border-line pl-2">
          {node.children!.map((child, i) => (
            <TreeNode key={child.label + i} node={child} depth={depth + 1} branchIdx={branchIdx} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductMap() {
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();

  const matches = (n: MapNode): boolean => {
    const self = (n.label + (n.detail || "")).toLowerCase().includes(q);
    const childMatch = n.children ? n.children.some(matches) : false;
    return self || childMatch;
  };

  const filtered = q ? PRODUCT_MAP.filter(matches) : PRODUCT_MAP;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">产品说明 · 思维导图</h1>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            观澜 ESG Compass · 产品说明 v9 · 与 <code className="font-mono">产品说明.md</code> 同步维护
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索节点…"
          className="w-full max-w-[220px] rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand-line placeholder:text-ink-faint"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((root, i) => (
          <div key={root.label} className={"rounded-lg border bg-surface p-3 " + BRANCH_COLORS[i % BRANCH_COLORS.length].ring}>
            <TreeNode node={root} depth={0} branchIdx={i} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-faint">
          未找到匹配节点
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface px-5 py-4">
        <p className="text-[12px] leading-relaxed text-ink-faint">
          说明：本页面数据源为 <code className="font-mono">lib/product-map.ts</code>，更新产品说明后同步修改该文件即可，页面自动生效。
        </p>
      </div>
    </div>
  );
}
