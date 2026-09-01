import { cn } from "@/lib/utils";
import type { Tone } from "./Badge";

interface StatusIndicatorProps {
  tone: Tone;
  /** Label announced to screen readers */
  label: string;
  /** Show a pulsing glow animation for active states */
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const dotColor: Record<Tone, string> = {
  neutral: "bg-slate-500",
  critical: "bg-red-400",
  warning: "bg-orange-400",
  success: "bg-emerald-400",
  info: "bg-cyan-400",
};

const glowColor: Record<Tone, string> = {
  neutral: "",
  critical: "shadow-[0_0_10px_#ef4444]",
  warning: "shadow-[0_0_10px_#f59e0b]",
  success: "shadow-[0_0_12px_#34d399]",
  info: "shadow-[0_0_10px_#06b6d4]",
};

export function StatusIndicator({ tone, label, pulse = false, size = "md", className }: StatusIndicatorProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-label={label}>
      <span
        className={cn(
          "rounded-full",
          dotSize,
          dotColor[tone],
          pulse && glowColor[tone],
          pulse && "animate-pulse",
        )}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold text-slate-300">{label}</span>
    </span>
  );
}
