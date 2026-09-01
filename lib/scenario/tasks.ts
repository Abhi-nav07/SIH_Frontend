import { Department, RecommendedAction, Task, TaskStatus } from "./types";

let counter = 0;
function nextId() {
  counter += 1;
  return `task-${counter}`;
}

const DEPARTMENTS_FOR_CRITICAL: { department: Department; title: (v: string) => string; sla: number }[] = [
  { department: "SDRF", title: (v) => `Deploy rescue team to ${v}`, sla: 20 * 60 },
  { department: "Police", title: (v) => `Coordinate evacuation traffic control near ${v}`, sla: 25 * 60 },
  { department: "Health", title: (v) => `Pre-position medical support for ${v} evacuees`, sla: 30 * 60 },
  { department: "Transport", title: (v) => `Arrange evacuation buses for ${v}`, sla: 30 * 60 },
];

const DEPARTMENTS_FOR_WATCH: { department: Department; title: (v: string) => string; sla: number }[] = [
  { department: "DDMA", title: (v) => `Issue advisory and monitor ${v}`, sla: 45 * 60 },
];

const REPLAN_DEPARTMENTS: { department: Department; title: (v: string) => string; sla: number }[] = [
  { department: "PWD", title: () => `Assess Bridge-3 damage and post road closure`, sla: 10 * 60 },
  { department: "Police", title: (v) => `Redirect ${v} evacuees to alternate route`, sla: 15 * 60 },
  { department: "Electricity", title: () => `Inspect power lines along alternate route`, sla: 40 * 60 },
];

export function tasksForAction(action: RecommendedAction, villageName: string, atSec: number): Task[] {
  const set = action.reasonCode === "HAZARD_HIGH_ROUTE_AT_RISK" ? DEPARTMENTS_FOR_CRITICAL : DEPARTMENTS_FOR_WATCH;
  return set.map((d) => ({
    id: nextId(),
    title: d.title(villageName),
    department: d.department,
    priority: action.reasonCode === "HAZARD_HIGH_ROUTE_AT_RISK" ? "P1" : "P2",
    status: "pending" as TaskStatus,
    reasonCode: action.reasonCode,
    createdAtSec: atSec,
    ackAtSec: null,
    completedAtSec: null,
    slaSeconds: d.sla,
    sourceActionId: action.id,
    generatedByReplan: false,
  }));
}

export function replanTasksForBridgeFailure(villageName: string, atSec: number): Task[] {
  return REPLAN_DEPARTMENTS.map((d) => ({
    id: nextId(),
    title: d.title(villageName),
    department: d.department,
    priority: "P1" as const,
    status: "pending" as TaskStatus,
    reasonCode: "BRIDGE_FAILURE_REPLAN",
    createdAtSec: atSec,
    ackAtSec: null,
    completedAtSec: null,
    slaSeconds: d.sla,
    sourceActionId: "replan",
    generatedByReplan: true,
  }));
}

export function acknowledgeTask(tasks: Task[], id: string, atSec: number): Task[] {
  return tasks.map((t) =>
    t.id === id && (t.status === "pending" || t.status === "escalated")
      ? { ...t, status: "acknowledged", ackAtSec: atSec }
      : t
  );
}

export function completeTask(tasks: Task[], id: string, atSec: number): Task[] {
  return tasks.map((t) =>
    t.id === id && (t.status === "acknowledged" || t.status === "pending")
      ? { ...t, status: "completed", completedAtSec: atSec, ackAtSec: t.ackAtSec ?? atSec }
      : t
  );
}

export function escalateOverdueTasks(tasks: Task[], nowSec: number): Task[] {
  return tasks.map((t) =>
    t.status === "pending" && nowSec - t.createdAtSec > t.slaSeconds ? { ...t, status: "escalated" } : t
  );
}

export function completionRate(tasks: Task[]) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function taskForCitizenAssistance(villageName: string, villageId: string, atSec: number): Task {
  return {
    id: nextId(),
    title: `Respond to mobility / medical assistance request — ${villageName}`,
    department: "SDRF",
    priority: "P1",
    status: "pending",
    reasonCode: "CITIZEN_ASSISTANCE_REQUEST",
    createdAtSec: atSec,
    ackAtSec: null,
    completedAtSec: null,
    slaSeconds: 15 * 60,
    sourceActionId: `citizen-${villageId}`,
    generatedByReplan: false,
  };
}
