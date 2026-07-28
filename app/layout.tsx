import type { Metadata } from "next";
import Link from "next/link";
import { Radar } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ESG 简报",
    template: "%s ｜ ESG 简报",
  },
  description: "3 分钟扫完当下全球 ESG 变化趋势，找到重点领域的原文与解读",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-10 border-b border-line bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-6 lg:px-10">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-surface">
                <Radar size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[15px] font-semibold tracking-wide text-ink">ESG 简报</span>
            </Link>
            <span className="ml-auto hidden text-[12px] text-ink-faint sm:block">
              全球 ESG 变化趋势 ｜ 原文与解读
            </span>
          </div>
        </header>
        <main>
          <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">{children}</div>
        </main>
      </body>
    </html>
  );
}
