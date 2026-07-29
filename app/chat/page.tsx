"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send, BookOpen, ExternalLink, Loader2, Sparkles } from "lucide-react";

interface Source { id: string; title: string; sourceName: string; sourceUrl: string; category: string; }
interface ChatMsg { role: "user" | "assistant"; content: string; sources?: Source[]; }

function ChatContent() {
  var searchParams = useSearchParams();
  var eventId = searchParams.get("event") || "";
  var [eventTitle, setEventTitle] = useState("");
  var [messages, setMessages] = useState<ChatMsg[]>([]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var endRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    if (eventId) {
      setMessages([{ role: "assistant", content: "你好，我是 ESG Compass 助手。我看到你正在查看一条 ESG 事件。关于这个话题，有什么想深入了解的吗？比如法规的具体要求、对业务的影响、或者该怎么做？" }]);
    } else {
      setMessages([{ role: "assistant", content: "你好，我是 ESG Compass 助手。你可以问我关于 ESG 政策、标准、评级、合规等方面的问题。我会基于知识库为你提供参考回答。" }]);
    }
  }, [eventId]);

  useEffect(function () { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function sendMessage() {
    var msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(function (prev) { return [...prev, { role: "user", content: msg }]; });
    setLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, eventId: eventId || undefined }),
    }).then(function (res) { return res.ok ? res.json() : null; }).then(function (data) {
      if (data) {
        if (eventTitle && !data.eventTitle) setEventTitle("");
        else if (data.eventTitle && !eventTitle) setEventTitle(data.eventTitle);
        setMessages(function (prev) { return [...prev, { role: "assistant", content: data.reply, sources: data.sources || [] }]; });
      } else {
        setMessages(function (prev) { return [...prev, { role: "assistant", content: "抱歉，我暂时无法回答这个问题。请稍后再试。" }]; });
      }
    }).catch(function () {
      setMessages(function (prev) { return [...prev, { role: "assistant", content: "网络连接异常，请检查后重试。" }]; });
    }).finally(function () { setLoading(false); });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col pb-6" style={{ minHeight: "calc(100vh - 8rem)" }}>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
          <ArrowLeft size={14} />返回首页
        </Link>
      </div>
      {eventTitle && (
        <div className="mb-4 rounded-lg border border-brand-line bg-brand-soft/50 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-deep"><Sparkles size={12} />当前上下文</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{eventTitle}</p>
        </div>
      )}
      <div className="mb-4 flex-1 space-y-4">
        {messages.map(function (msg, idx) {
          return (
            <div key={idx} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[85%] rounded-lg px-4 py-3 " + (msg.role === "user" ? "bg-brand text-surface rounded-br-sm" : "border border-line bg-surface rounded-bl-sm")}>
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-line/50 pt-2">
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-ink-faint"><BookOpen size={10} />参考来源</div>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map(function (s) {
                        return (
                          <a key={s.id} href={s.sourceUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-0.5 rounded border border-line bg-paper px-2 py-0.5 text-[10px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand-deep">
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
            <div className="rounded-lg border border-line bg-surface px-4 py-3 rounded-bl-sm">
              <div className="flex items-center gap-2 text-[13px] text-ink-soft"><Loader2 size={14} className="animate-spin" />正在思考…</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 rounded-lg border border-line bg-surface p-2">
        <div className="flex items-center gap-2">
          <input value={input} onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="输入你的ESG相关问题…"
            className="flex-1 bg-transparent px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint" />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-[12px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-40">
            <Send size={13} />发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl py-20 text-center text-[13px] text-ink-faint">加载中…</div>}>
      <ChatContent />
    </Suspense>
  );
}
