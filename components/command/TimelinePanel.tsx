"use client";

import { useScenarioStore } from "@/lib/scenario/store";
import { formatClock } from "@/lib/scenario/timeline";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/Badge";

const KIND_TONE: Record<string, Tone> = { 
  info: "info", 
  warning: "warning", 
  critical: "critical", 
  success: "success" 
};

export function TimelinePanel() {
  const events = useScenarioStore((s) => s.events);
  const clockSeconds = useScenarioStore((s) => s.clockSeconds);

  return (
    <div className="mt-4 rounded-xl border border-white/7 bg-black/10 p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-overline">Operational timeline</span>
        <strong className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-xs text-slate-300" aria-label={`Current elapsed time: ${formatClock(clockSeconds)}`}>
          T+ {formatClock(clockSeconds)}
        </strong>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && (
          <div className="py-3 text-center text-xs text-slate-600">Events will appear when the exercise starts.</div>
        )}
        <ol className="space-y-2" aria-label="Timeline of events">
          {events
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-lg bg-white/[0.025] px-3 py-2.5 text-xs">
                <span className="mt-0.5 font-mono text-slate-500" aria-label={`At time ${formatClock(e.atSec)}`}>
                  {formatClock(e.atSec)}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-200">{e.label}</span>
                    <Badge tone={KIND_TONE[e.kind]}>{e.kind}</Badge>
                  </div>
                  <div className="mt-1 text-slate-500">{e.detail}</div>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
}
