import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "critical" | "warning" | "success" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: BadgeSize;
  /** Renders a small status dot before the text */
  dot?: boolean;
}

const toneStyles: Record<Tone, string> = {
  neutral: "bg-white/[0.07] text-slate-300 ring-1 ring-white/8",
  critical: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  warning: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  info: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
};

const dotColors: Record<Tone, string> = {
  neutral: "bg-slate-400",
  critical: "bg-red-400",
  warning: "bg-amber-400",
  success: "bg-emerald-400",
  info: "bg-sky-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[9px]",
  md: "px-2.5 py-1 text-[10px]",
};

export function Badge({ tone = "neutral", size = "md", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.08em]",
        sizeStyles[size],
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}
