"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, ShieldAlert } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { formatClock } from "@/lib/scenario/timeline";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, Sidebar } from "./Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { DEMO_DISCLAIMER } from "@/lib/scenario/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const phase = useScenarioStore((state) => state.phase);
  const clockSeconds = useScenarioStore((state) => state.clockSeconds);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#050b14] lg:flex">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>

        <Sidebar />

        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/7 bg-[#07111f]/92 px-4 backdrop-blur-xl lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <ShieldAlert size={17} aria-hidden="true" />
              </span>
              <span className="text-xs font-black tracking-[0.14em] text-white">SANKAT SETU</span>
            </Link>
            <div
              className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400"
              role="status"
              aria-label={`Exercise time: ${formatClock(clockSeconds)}`}
            >
              <Radio
                size={12}
                className={phase === "idle" ? "text-slate-500" : "text-emerald-400"}
                aria-hidden="true"
              />
              <span className="font-mono">{formatClock(clockSeconds)}</span>
            </div>
          </header>

          {/* Main content area */}
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1660px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7 xl:px-10"
          >
            {children}
          </main>

          {/* Prototype disclaimer — visible on desktop */}
          <footer className="mx-auto hidden max-w-[1660px] px-8 pb-6 lg:block xl:px-10">
            <p className="text-[10px] leading-relaxed text-slate-600">
              ⚠ {DEMO_DISCLAIMER}
            </p>
          </footer>
        </div>

        {/* Mobile bottom navigation — 44px minimum touch targets */}
        <nav
          className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-white/8 bg-[#07111f]/96 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-2xl lg:hidden"
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                  active ? "text-orange-400" : "text-slate-500",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="w-full truncate text-center">{shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        {/* Screen-reader live region for status announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-live" id="sr-announcer" />
      </div>
    </ToastProvider>
  );
}
