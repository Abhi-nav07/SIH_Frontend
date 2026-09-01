"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { formatClock } from "@/lib/scenario/timeline";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "Command Center", shortLabel: "Command", icon: LayoutDashboard },
  { href: "/tasks", label: "Action Board", shortLabel: "Actions", icon: ClipboardList },
  { href: "/intelligence", label: "Decision Intelligence", shortLabel: "Copilot", icon: Bot },
  { href: "/citizen", label: "Last-Mile Alert", shortLabel: "Citizen", icon: Smartphone },
  { href: "/plan", label: "Living DDMP", shortLabel: "DDMP", icon: FileStack },
  { href: "/after", label: "After-Action", shortLabel: "Review", icon: BarChart3 },
] as const;

const PHASE_LABEL: Record<string, string> = {
  idle: "Scenario standby",
  warning: "Warning received",
  active: "Exercise live",
  replanned: "Plan recalculated",
};

export function Sidebar() {
  const pathname = usePathname();
  const phase = useScenarioStore((state) => state.phase);
  const clockSeconds = useScenarioStore((state) => state.clockSeconds);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[276px] shrink-0 flex-col border-r border-white/7 bg-[#07111f]/95 px-4 py-5 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-red-950/40 transition-transform group-hover:-translate-y-0.5">
          <ShieldAlert size={22} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-black tracking-[0.16em] text-white">SANKAT SETU</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Alert to action
          </span>
        </span>
      </Link>

      {/* Navigation section label */}
      <div className="mt-7 px-3 text-overline">Operations</div>

      {/* Primary navigation */}
      <nav className="mt-2 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                active
                  ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-orange-400" />}
              <Icon
                size={17}
                className={active ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300"}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Scenario status panel */}
      <div className="space-y-3">
        <div
          className="rounded-2xl border border-white/8 bg-white/[0.035] p-3.5"
          role="status"
          aria-label={`${PHASE_LABEL[phase] ?? "Unknown"}, exercise time ${formatClock(clockSeconds)}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  phase === "idle"
                    ? "bg-slate-500"
                    : "bg-emerald-400 shadow-[0_0_12px_#34d399]",
                )}
                aria-hidden="true"
              />
              {PHASE_LABEL[phase] ?? "Unknown"}
            </span>
            <span className="font-mono text-xs text-slate-500">{formatClock(clockSeconds)}</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                phase === "idle"
                  ? "w-1/5 bg-slate-600"
                  : phase === "replanned"
                    ? "w-full bg-emerald-400"
                    : "w-3/5 bg-orange-400",
              )}
            />
          </div>
        </div>
        <div className="px-2 text-[10px] leading-relaxed text-slate-600">
          SIH26206 · AICTE
          <br />
          Simulated disaster-management exercise
        </div>
      </div>
    </aside>
  );
}
