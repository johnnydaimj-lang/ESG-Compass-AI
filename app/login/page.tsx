"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/ops");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "密码错误");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm items-center">
      <div className="w-full">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
          <ArrowLeft size={14} />返回首页
        </Link>
        <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-soft">
              <ShieldCheck size={15} className="text-brand-deep" />
            </div>
            <h1 className="text-[15px] font-semibold text-ink">管理员登录</h1>
          </div>
          <p className="mb-4 text-[12.5px] leading-relaxed text-ink-soft">输入管理密码以访问运营后台与内容审校。</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理密码"
                autoFocus
                className="w-full rounded-md border border-line bg-paper py-2.5 pl-9 pr-3 text-[13px] text-ink outline-none focus:border-brand-line placeholder:text-ink-faint"
              />
            </div>
            {error && <p className="text-[12px] text-risk">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand py-2.5 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              登录
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
