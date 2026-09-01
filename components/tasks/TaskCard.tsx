"use client";

import { Check, Clock3, Radio, Siren } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useScenarioStore } from "@/lib/scenario/store";
import { Task, TaskStatus } from "@/lib/scenario/types";
import { formatClock } from "@/lib/scenario/timeline";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/Badge";

const STATUS_TONE: Record<TaskStatus, Tone> = {
  pending: "neutral",
  acknowledged: "info",
  completed: "success",
  escalated: "critical",
};

export function TaskCard({ task }: { task: Task }) {
  const clockSeconds = useScenarioStore((state) => state.clockSeconds);
  const acknowledgeTaskById = useScenarioStore((state) => state.acknowledgeTaskById);
  const completeTaskById = useScenarioStore((state) => state.completeTaskById);
  const elapsed = Math.max(0, clockSeconds - task.createdAtSec);
  const remaining = Math.max(0, task.slaSeconds - elapsed);

  return (
    <article
      role="listitem"
      className={cn(
        "rounded-xl border bg-white/[0.025] p-3.5 transition-colors sm:p-4",
        task.status === "escalated" ? "border-red-500/25" : "border-white/7 hover:border-white/12",
      )}
      aria-label={`${task.priority} ${task.department}: ${task.title} — ${task.status}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={task.priority === "P1" ? "critical" : "warning"}>{task.priority}</Badge>
            <Badge tone="neutral">{task.department}</Badge>
            {task.generatedByReplan && <Badge tone="info">Replan</Badge>}
            <Badge tone={STATUS_TONE[task.status]}>{task.status}</Badge>
          </div>
          <h3 className="mt-2.5 text-sm font-bold leading-5 text-slate-200">{task.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600">
            <span>{task.reasonCode}</span>
            <span className="flex items-center gap-1">
              <Clock3 size={10} aria-hidden="true" /> SLA {formatClock(task.slaSeconds)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {(task.status === "pending" || task.status === "escalated") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => acknowledgeTaskById(task.id)}
              aria-label={`Acknowledge task: ${task.title}`}
            >
              <Radio size={13} aria-hidden="true" /> Acknowledge
            </Button>
          )}
          {(task.status === "pending" || task.status === "acknowledged" || task.status === "escalated") && (
            <Button
              size="sm"
              variant="success"
              onClick={() => completeTaskById(task.id)}
              aria-label={`Complete task: ${task.title}`}
            >
              <Check size={13} aria-hidden="true" /> Complete
            </Button>
          )}
        </div>
      </div>

      {task.status !== "completed" && (
        <div className="mt-3 flex items-center gap-3">
          <Progress value={elapsed} max={task.slaSeconds} label={`SLA progress for ${task.title}`} />
          <span
            className={cn(
              "flex min-w-20 items-center justify-end gap-1 font-mono text-[10px]",
              task.status === "escalated" ? "text-red-400" : "text-slate-500",
            )}
          >
            {task.status === "escalated" ? (
              <>
                <Siren size={11} aria-hidden="true" /> overdue
              </>
            ) : (
              `${formatClock(remaining)} left`
            )}
          </span>
        </div>
      )}
    </article>
  );
}
