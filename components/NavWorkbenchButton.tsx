"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Loader2, Lock } from "lucide-react";

export default function NavWorkbenchButton() {
  var [showModal, setShowModal] = useState(false);
  var [password, setPassword] = useState("");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var router = useRouter();

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
        setShowModal(false);
        setPassword("");
        router.push("/workbench");
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
    <>
      <button onClick={function () { setShowModal(true); }}
        className="inline-flex items-center gap-1 rounded-md border border-brand-line bg-brand-soft px-3 py-1.5 text-[13px] font-medium text-brand-deep transition-colors hover:bg-brand-line">
        <Sparkles size={13} />工作台
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={function (e) { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft">
                  <Sparkles size={15} className="text-brand-deep" />
                </div>
                <h2 className="text-[15px] font-semibold text-ink">进入工作台</h2>
              </div>
              <button onClick={function () { setShowModal(false); }}
                className="rounded p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-[12.5px] leading-relaxed text-ink-soft">输入管理密码以访问个人 ESG 工作台，包含 AI 助手与私人知识库。</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="password" value={password} onChange={function (e) { setPassword(e.target.value); }}
                  placeholder="管理密码" autoFocus
                  className="w-full rounded-md border border-line bg-paper pl-9 pr-3 py-2.5 text-[13px] text-ink outline-none focus:border-brand-line placeholder:text-ink-faint" />
              </div>
              {error && <p className="text-[12px] text-risk">{error}</p>}
              <button type="submit" disabled={loading || !password}
                className="w-full rounded-md bg-brand py-2.5 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50">
                {loading ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />验证中…</span> : "确认进入"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
