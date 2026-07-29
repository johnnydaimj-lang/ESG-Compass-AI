import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavWorkbenchButton from "@/components/NavWorkbenchButton";

export const metadata: Metadata = {
  title: { default: "ESG Compass", template: "%s ｜ ESG Compass" },
  description: "3 分钟扫完当下全球 ESG 变化趋势，找到重点领域的原文与解读",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-10 border-b border-line bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-6 lg:px-10">
            <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-dashed border-line-strong text-[10px] text-ink-faint bg-surface" title="Logo 待 AI design 生成">?</span>
              <span className="text-[15px] font-semibold tracking-wide text-ink">ESG Compass</span>
            </Link>
            <div className="flex-1" />
            <Link href="/" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand-deep">ESG快讯</Link>
            <Link href="/kb" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand-deep">知识库</Link>
            <Link href="/zones" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand-deep">知识专区</Link>
          <NavWorkbenchButton />
          </div>
          </div>
        </header>
        <main><div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">{children}</div></main>
      </body>
    </html>
  );
}
