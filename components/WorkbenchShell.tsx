"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Library, Map, Radar, Sparkles } from "lucide-react";
import WorkbenchPersonalFeed from "@/components/WorkbenchPersonalFeed";
import WorkbenchAgentChat from "@/components/WorkbenchAgentChat";
import WorkbenchKnowledgeBase from "@/components/WorkbenchKnowledgeBase";
import WorkbenchHarness from "@/components/WorkbenchHarness";
import type { ContentItem } from "@/lib/esg-data-client";

type ModuleKey = "feed" | "agent" | "kb";

function WorkbenchContent({ contents }: { contents: ContentItem[] }) {
  var searchParams = useSearchParams();
  var eventId = searchParams.get("event") || "";
  var [authenticated, setAuthenticated] = useState(false);
  var [checking, setChecking] = useState(true);
  var [active, setActive] = useState<ModuleKey>(eventId ? "agent" : "feed");

  useEffect(function () {
    fetch("/api/auth/check", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (data) { setAuthenticated(Boolean(data.authenticated)); })
      .catch(function () { setAuthenticated(false); })
      .finally(function () { setChecking(false); });
  }, []);

  if (checking) {
    return <div className="mx-auto max-w-6xl py-20 text-center text-[13px] text-ink-faint">验证中…</div>;
  }

  if (!authenticated) {
    return <WorkbenchAuthForm onSuccess={function () { setAuthenticated(true); }} />;
  }

  var modules: { key: ModuleKey; label: string; desc: string; icon: typeof Radar }[] = [
    { key: "feed", label: "信息筛选器", desc: "个人视图", icon: Radar },
    { key: "agent", label: "专属 Agent", desc: "检索 · 分析 · 起草", icon: Bot },
    { key: "kb", label: "独立知识库", desc: "公开 + 私密资料", icon: Library },
  ];
  var subtitle = active === "feed"
    ? "按关注偏好过滤的 ESG 快讯"
    : active === "agent"
      ? "专属 ESG 知识顾问，回答消耗 Token"
      : "公开标准与本地私密资料";

  return (
    <div className="mx-auto max-w-6xl pb-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-line bg-brand-soft">
            <Sparkles size={16} className="text-brand-deep" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">个人 ESG 工作台</h1>
            <p className="text-[11px] text-ink-faint">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ops/product-map" className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface"><Map size={12} />产品思维导图</Link>
          <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">运营后台</Link>
          <Link href="/" className="rounded-md bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand-deep transition-colors hover:bg-brand-line"><ArrowLeft size={12} className="inline" />返回首页</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="space-y-2 lg:col-span-1">
          {modules.map(function (m) {
            var Icon = m.icon;
            var isActive = m.key === active;
            return (
              <button key={m.key} type="button" onClick={function () { setActive(m.key); }}
                className={"flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors " + (isActive ? "border-brand-line bg-brand-soft" : "border-line bg-surface hover:border-line-strong")}>
                <span className={"flex h-8 w-8 items-center justify-center rounded-md " + (isActive ? "bg-brand text-surface" : "bg-paper text-ink-soft")}><Icon size={14} /></span>
                <span>
                  <span className="block text-[13px] font-medium text-ink">{m.label}</span>
                  <span className="block text-[10px] text-ink-faint">{m.desc}</span>
                </span>
              </button>
            );
          })}
          <div className="rounded-lg border border-dashed border-line bg-paper p-3 text-[11px] leading-relaxed text-ink-faint">公开层继续对外开放；以下模块仅你本人可见。</div>
        </aside>

        <section className="min-w-0 lg:col-span-3">
          {active === "feed" && <WorkbenchPersonalFeed contents={contents} />}
          {active === "agent" && (
  <div className="space-y-4">
    <WorkbenchHarness />
    <WorkbenchAgentChat eventId={eventId} />
  </div>
)}
          {active === "kb" && <WorkbenchKnowledgeBase />}
        </section>
      </div>
    </div>
  );
}

function WorkbenchAuthForm({ onSuccess }: { onSuccess: () => void }) {
  var [password, setPassword] = useState("");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      var res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        var data = await res.json();
        setError(data.error || "密码错误");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto mt-20 max-w-sm">
      <div className="rounded-lg border border-line bg-surface p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-deep"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-lg font-semibold text-ink">ESG Compass</h1>
          <p className="mt-1 text-[13px] text-ink-soft">输入管理密码进入工作台</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={password} onChange={function (e) { setPassword(e.target.value); }}
            placeholder="管理密码" autoFocus
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[13px] text-ink outline-none focus:border-brand-line" />
          {error && <p className="text-[12px] text-risk">{error}</p>}
          <button type="submit" disabled={loading || !password}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-[13px] font-medium text-surface hover:bg-brand-deep disabled:opacity-50">
            {loading ? "验证中…" : "进入工作台"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function WorkbenchShell({ contents }: { contents: ContentItem[] }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl py-20 text-center text-[13px] text-ink-faint">加载中…</div>}>
      <WorkbenchContent contents={contents} />
    </Suspense>
  );
}