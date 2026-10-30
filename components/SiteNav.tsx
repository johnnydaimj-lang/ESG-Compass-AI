"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Layers3, Newspaper } from "lucide-react";

const PRIMARY_LINKS = [
  { href: "/", label: "ESG快讯", icon: Newspaper },
  { href: "/zones", label: "知识专区", icon: Layers3 },
  { href: "/daily", label: "日报", icon: CalendarDays },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/events/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="主导航" className="hidden items-center gap-0.5 sm:flex">
        {PRIMARY_LINKS.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors lg:px-3 " +
                (active
                  ? "bg-brand-soft text-brand-deep"
                  : "text-ink-soft hover:bg-brand-soft/70 hover:text-brand-deep")
              }
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/login"
          className="ml-1 hidden rounded-md px-2.5 py-1.5 text-[12px] text-ink-faint transition-colors hover:bg-paper hover:text-ink-soft md:inline-flex"
        >
          管理
        </Link>
      </nav>

      <nav
        aria-label="移动端主导航"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="grid h-16 grid-cols-3">
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors " +
                  (active ? "text-brand-deep" : "text-ink-faint hover:text-ink-soft")
                }
              >
                <span
                  className={
                    "flex h-7 w-9 items-center justify-center rounded-md transition-colors " +
                    (active ? "bg-brand-soft" : "")
                  }
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="truncate px-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
