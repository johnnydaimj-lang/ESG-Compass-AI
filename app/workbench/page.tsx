"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, BookOpen, ExternalLink, Database, Sparkles, Map, ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";

interface Source { id: string; title: string; sourceName: string; sourceUrl: string; category: string; }
interface ChatMsg { role: "user" | "assistant"; content: string; sources?: Source[]; }

function WorkbenchContent() {
  // Hooks always at top level, before any conditional return
  var searchParams = useSearchParams();
  var eventId = searchParams.get("event") || "";
  var [authenticated, setAuthenticated] = useState(false);
  var [checking, setChecking] = useState(true);
  var [messages, setMessages] = useState<ChatMsg[]>([]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var endRef = useRef<HTMLDivElement>(null);

  var kbTotal = KNOWLEDGE_BASE.length;
  var kbCategories = Array.from(new Set(KNOWLEDGE_BASE.map(function (k) { return k.category; }))).join(" / ");

  useEffect(function () {
    var authed = typeof document !== "undefined" && document.cookie.includes("admin_session=true");
    setAuthenticated(authed);
    setChecking(false);
  }, []);

  useEffect(function () {
    if (eventId) {
      setMessages([{ role: "assistant", content: "你好，我是你的个人 ESG 工作台。我看到你在查看一条 ESG 事件。关于这个话题，有什么想深入了解的吗？比如法规的具体要求、对业务的影响，或者该怎么做？" }]);
    } else {
      setMessages([{ role: "assistant", content: "欢迎回到工作台。你可以问我关于 ESG 政策、标准、评级、合规等方面的问题。回答基于公开知识库 + 你的私人知识库。" }]);
    }
  }, [eventId]);

  useEffect(function () { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function sendMessage() {
    var msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(function (prev) { return [...prev, { role: "user", content: msg }]; });
    setLoading(true);
    fetch("/api/workbench/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, eventId: eventId || undefined }),
    }).then(function (res) { return res.ok ? res.json() : null; }).then(function (data) {
      if (data) {
        setMessages(function (prev) { return [...prev, { role: "assistant", content: data.reply, sources: data.sources || [] }]; });
      } else {
        setMessages(function (prev) { return [...prev, { role: "assistant", content: "抱歉，我暂时无法回答这个问题。请稍后再试。" }]; });
      }
    }).catch(function () {
      setMessages(function (prev) { return [...prev, { role: "assistant", content: "网络异常，请检查后重试。" }]; });
    }).finally(function () { setLoading(false); });
  }

  if (checking) {
    return <div className="mx-auto max-w-5xl py-20 text-center text-[13px] text-ink-faint">验证中…</div>;
  }

  if (!authenticated) {
    return <WorkbenchAuthForm onSuccess={function () { setAuthenticated(true); }} />;
  }

  return (
    <div className="mx-auto max-w-5xl pb-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-line bg-brand-soft">
            <Sparkles size={15} className="text-brand-deep" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">个人工作台</h1>
            <p className="text-[11px] text-ink-faint">私人 ESG 知识库 · AI 助手</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ops/product-map" className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface"><Map size={12} />产品思维导图</Link>
          <Link href="/ops" className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface">运营后台</Link>
          <Link href="/" className="rounded-md bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand-deep transition-colors hover:bg-brand-line"><ArrowLeft size={12} className="inline" />返回首页</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Database size={14} className="text-brand-deep" />知识库概览
            </h2>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-ink-soft">已入库条目</span><span className="font-medium text-ink">{kbTotal}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">分类</span><span className="font-medium text-ink">{kbCategories}</span></div>
              <div className="flex justify-between"><span className="text-ink-soft">数据来源</span><span className="font-medium text-ink">公开 KB + 私人</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <BookOpen size={14} className="text-brand-deep" />快速操作
            </h2>
            <div className="space-y-2">
              <button disabled className="w-full rounded-md border border-line bg-paper px-3 py-2 text-left text-[12px] text-ink-faint transition-colors hover:border-line-strong">
                同步 Obsidian 仓库（即将上线）
              </button>
              <button disabled className="w-full rounded-md border border-line bg-paper px-3 py-2 text-left text-[12px] text-ink-faint transition-colors hover:border-line-strong">
                导入 Markdown 文件（即将上线）
              </button>
              <Link href="/ops" className="block rounded-md border border-line bg-paper px-3 py-2 text-[12px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink">
                前往运营后台 →
              </Link>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-col lg:col-span-2">
          <div className="mb-3 flex-1 space-y-4" style={{ minHeight: "400px", maxHeight: "550px", overflowY: "auto" }}>
            {messages.map(function (msg, idx) {
              return (
                <div key={idx} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[88%] rounded-lg px-4 py-3 " + (msg.role === "user" ? "bg-brand text-surface" : "border border-line bg-surface")}>
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 border-t border-line/50 pt-2">
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-ink-faint"><BookOpen size={10} />参考来源</div>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map(function (s) {
                            return (
                              <a key={s.id} href={s.sourceUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-0.5 rounded border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-soft hover:bg-brand-soft hover:text-brand-deep">
                                {s.title.substring(0, 16)}{s.title.length > 16 ? "..." : ""}<ExternalLink size={9} />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-line bg-surface px-4 py-3">
                  <div className="flex items-center gap-2 text-[13px] text-ink-soft"><Loader2 size={14} className="animate-spin" />正在思考…</div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="rounded-lg border border-line bg-surface p-2">
            <div className="flex items-center gap-2">
              <input value={input} onChange={function (e) { setInput(e.target.value); }}
                onKeyDown={function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="输入你的 ESG 问题…"
                className="flex-1 bg-transparent px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint" />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-[12px] font-medium text-surface hover:bg-brand-deep disabled:opacity-40">
                <Send size={13} />发送
              </button>
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-ink-faint">提示：AI 回答消耗 Token，仅你可见</div>
        </div>
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

export default function WorkbenchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl py-20 text-center text-[13px] text-ink-faint">加载中…</div>}>
      <WorkbenchContent />
    </Suspense>
  );
}
