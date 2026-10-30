import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LogoMark from "@/components/LogoMark";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('esg-theme');var d=t==='light'||t==='dark'?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export const metadata: Metadata = {
  title: { default: "ESG Compass", template: "%s | ESG Compass" },
  description: "3 分钟扫完当下全球 ESG 变化趋势，找到重点领域的原文与解读",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-10 border-b border-line bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-10">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <LogoMark className="h-8 w-8 text-brand" />
              <span className="flex flex-col justify-center leading-none">
                <span className="text-[16px] font-semibold tracking-[0.08em] text-ink">观澜</span>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-faint">ESG Compass</span>
              </span>
            </Link>
            <SiteNav />
            <div className="ml-auto flex shrink-0 items-center">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main>
          <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10 lg:px-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
