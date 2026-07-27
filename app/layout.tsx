import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ESG 简报",
    template: "%s ｜ ESG 简报",
  },
  description: "面向企业业务与合规团队的全球 ESG 变化情报工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
