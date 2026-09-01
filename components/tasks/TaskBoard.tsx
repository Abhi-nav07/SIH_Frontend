"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useScenarioStore } from "@/lib/scenario/store";
import { TaskStatus } from "@/lib/scenario/types";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: "all" | TaskStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Acknowledged", value: "acknowledged" },
  { label: "Escalated", value: "escalated" },
  { label: "Completed", value: "completed" },
];

export function TaskBoard() {
  const tasks = useScenarioStore((state) => state.tasks);
  const role = useScenarioStore((state) => state.role);
  const isReadOnly = role === "Observer / Jury View";
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [query, setQuery] = useState("");

    const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => filter === "all" || task.status === filter)
      .filter((task) => deptFilter === "all" || task.department === deptFilter)
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter(
        (task) =>
          !normalized ||
          `${task.title} ${task.department} ${task.reasonCode}`.toLowerCase().includes(normalized),
      )
      .sort((a, b) => {
        const statusWeight: Record<TaskStatus, number> = { 
          escalated: 0, pending: 1, acknowledged: 2, in_progress: 3, 
          blocked: 4, dispatched: 5, draft: 6, completed: 7, cancelled: 8, superseded: 9 
        };
        return (
          statusWeight[a.status] - statusWeight[b.status] ||
          a.priority.localeCompare(b.priority) ||
          a.createdAtSec - b.createdAtSec
        );
      });
  }, [filter, query, tasks, deptFilter, priorityFilter]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center">
        <div className="text-sm font-semibold text-slate-300">No operational tasks yet</div>
        <div className="mt-1 text-xs text-slate-500">
          Start the exercise from Command Center to generate department assignments.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-white/7 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter tasks by status">
          {FILTERS.map((item) => {
            const count =
              item.value === "all"
                ? tasks.length
                : tasks.filter((task) => task.status === item.value).length;
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={isActive}
                className={cn(
                  "min-h-[36px] rounded-lg px-2.5 py-2 text-[10px] font-bold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300",
                )}
              >
                {item.label}{" "}
                <span className="ml-1 font-mono text-[9px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-white/8 bg-black/10 px-3 text-xs text-slate-500 focus-within:border-cyan-500/40">
          <Search size={13} aria-hidden="true" />
          <span className="sr-only">Search operational tasks</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="w-full bg-transparent py-2 text-slate-200 outline-none placeholder:text-slate-600 xl:w-40"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2.5" role="list" aria-label="Operational tasks">
        {visibleTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {visibleTasks.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-500">No tasks match this filter.</div>
        )}
      </div>
    </div>
  );
}
