import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/Badge";

interface StatCardProps {
  trendValue?: string | number;
  trendDirection?: 'up' | 'down' | 'none';
  trendReason?: string;
  label: string;
  value: string | number;
  hint: string;
  tone?: Tone;
  className?: string;
}

const dotColor: Record<Tone, string> = {
  neutral: "bg-slate-500",
  critical: "bg-red-400",
  warning: "bg-orange-400",
  success: "bg-emerald-400",
  info: "bg-cyan-400",
};

export function StatCard({ label, value, hint, tone = "neutral", className, trendValue, trendDirection = "none", trendReason }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden px-4 py-4 sm:px-5", className)}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])} aria-hidden="true" />
        <span className="sr-only">Status: {tone}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[28px]" aria-label={`${label}: ${value}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{hint}</div>
      {trendValue !== undefined && trendDirection !== 'none' && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className={cn(
            "flex items-center gap-0.5 rounded px-1 py-0.5",
            trendDirection === 'up' ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          )}>
            {trendDirection === 'up' ? "↑" : "↓"} {trendValue}
          </span>
          {trendReason && <span>due to {trendReason}</span>}
        </div>
      )}

    </Card>
  );
}
