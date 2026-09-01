"use client";

import { AlertTriangle, Clock3 } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { Badge } from "@/components/ui/Badge";
import { formatClock } from "@/lib/scenario/timeline";

export function EscalationFeed() {
  const tasks = useScenarioStore((state) => state.tasks);
  const clockSeconds = useScenarioStore((state) => state.clockSeconds);
  const escalated = tasks.filter((task) => task.status === "escalated");
  const nextDue = tasks
    .filter((task) => task.status === "pending")
    .sort(
      (a, b) =>
        a.slaSeconds -
        (clockSeconds - a.createdAtSec) -
        (b.slaSeconds - (clockSeconds - b.createdAtSec))
    )
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {escalated.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.055] px-4 py-5 text-center">
          <div className="text-xs font-bold text-emerald-300">All SLAs within limit</div>
          <div className="mt-1 text-[11px] text-emerald-200/50">Unacknowledged tasks will escalate automatically.</div>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Escalated tasks">
          {escalated.map((task) => (
            <li key={task.id} className="rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="critical">SLA breached</Badge>
                <AlertTriangle size={14} className="text-red-400" aria-hidden="true" />
              </div>
              <div className="mt-2 text-xs font-semibold leading-5 text-slate-200">{task.title}</div>
              <div className="mt-1 text-[10px] text-slate-500">Escalate to {task.department} control</div>
            </li>
          ))}
        </ul>
      )}

      {nextDue.length > 0 && (
        <section aria-labelledby="next-deadlines">
          <h3 id="next-deadlines" className="mb-2 text-overline">Next deadlines</h3>
          <ul className="space-y-2">
            {nextDue.map((task) => {
              const remaining = Math.max(0, task.slaSeconds - (clockSeconds - task.createdAtSec));
              return (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-white/7 bg-white/[0.025] p-2.5"
                >
                  <div className="text-[11px] leading-4 text-slate-400">
                    {task.department}
                    <br />
                    <span className="text-slate-600">{task.priority}</span>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-orange-300" aria-label={`${formatClock(remaining)} remaining`}>
                    <Clock3 size={10} aria-hidden="true" /> {formatClock(remaining)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
