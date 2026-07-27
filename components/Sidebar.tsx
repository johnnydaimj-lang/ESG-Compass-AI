"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Compass,
  FileText,
  House,
  LayoutGrid,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: House },
  { href: "/workspace", label: "工作台", icon: LayoutGrid },
  { href: "/brief", label: "简报生成", icon: FileText },
  { href: "/discover", label: "搜索与发现", icon: Compass },
  { href: "/subscriptions", label: "订阅中心", icon: SlidersHorizontal },
  { href: "/admin", label: "运营后台", icon: ShieldCheck },
  { href: "/column", label: "评级与奖项", icon: Award },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-surface">
          <Radar size={17} strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-wide">ESG 简报</div>
          <div className="text-[11px] text-ink-faint">esg-radar-mvp</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors ${
                active
                  ? "bg-brand-soft font-medium text-brand-deep"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-brand" : "text-ink-faint"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/ask"
          className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
            pathname.startsWith("/ask")
              ? "bg-brand text-surface"
              : "bg-brand-soft text-brand-deep hover:bg-brand-line/60"
          }`}
        >
          <Sparkles size={16} strokeWidth={2} />
          AI 检索
          <span className="ml-auto rounded bg-surface/20 px-1.5 py-0.5 text-[10px] font-normal text-current opacity-80">
            Beta
          </span>
        </Link>
      </div>
    </aside>
  );
}
