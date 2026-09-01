import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  /** Colour based on progress: auto-determines from value, or override with tone */
  tone?: "critical" | "warning" | "success" | "info" | "auto";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

function autoTone(percent: number): string {
  if (percent >= 100) return "bg-red-400";
  if (percent >= 70) return "bg-orange-400";
  return "bg-cyan-400";
}

const toneBar: Record<string, string> = {
  critical: "bg-red-400",
  warning: "bg-orange-400",
  success: "bg-emerald-400",
  info: "bg-cyan-400",
};

export function Progress({ value, max = 100, tone = "auto", size = "sm", label, className }: ProgressProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const barColor = tone === "auto" ? autoTone(percent) : toneBar[tone];
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn("flex-1 overflow-hidden rounded-full bg-slate-800", height)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {label === undefined && (
        <span className="min-w-10 text-right font-mono text-xs font-bold text-slate-400">{percent}%</span>
      )}
    </div>
  );
}
