"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Preference = "light" | "system" | "dark";

const STORAGE_KEY = "esg-theme";

function resolve(pref: Preference): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): Preference {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

const CHOICES: Array<{ key: Preference; label: string; icon: typeof Sun }> = [
  { key: "light", label: "浅色", icon: Sun },
  { key: "system", label: "跟随系统", icon: Monitor },
  { key: "dark", label: "深色", icon: Moon },
];

export default function ThemeToggle() {
  const [pref, setPref] = useState<Preference>("system");

  useEffect(() => {
    const stored = readPreference();
    setPref(stored);
    document.documentElement.setAttribute("data-theme", resolve(stored));
  }, []);

  function apply(next: Preference) {
    setPref(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", resolve(next));
  }

  return (
    <div
      role="group"
      aria-label="外观主题"
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
    >
      {CHOICES.map((choice) => {
        const Icon = choice.icon;
        const active = pref === choice.key;
        return (
          <button
            key={choice.key}
            type="button"
            onClick={() => apply(choice.key)}
            title={choice.label}
            aria-label={choice.label}
            aria-pressed={active}
            className={
              "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors " +
              (active ? "bg-brand-soft text-brand-deep" : "text-ink-faint hover:text-ink-soft")
            }
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
