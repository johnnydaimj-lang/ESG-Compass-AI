import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="mb-4 text-5xl font-semibold tracking-tight text-ink">404</h1>
      <p className="mb-6 text-[14px] text-ink-soft">未找到该条内容</p>
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-brand-deep">
        <ArrowLeft size={14} />返回首页
      </Link>
    </div>
  );
}