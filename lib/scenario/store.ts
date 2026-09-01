"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AfterActionMetrics,
  CitizenInstruction,
  CitizenResponse,
  RecommendedAction,
  RouteEdge,
  IncidentPhase,
  Shelter,
  Task,
  TimelineEvent,
  Village,
} from "./types";
import { INITIAL_EDGES, INITIAL_SHELTERS, INITIAL_VILLAGES } from "./data";
import { scoreAllVillages } from "./risk";
import { failBridgeEdges, shelterIdForEdge } from "./routing";
import { generateActions, supersedeActionsForVillage } from "./actions";
import {
  acknowledgeTask,
  completeTask as completeTaskFn,
  escalateOverdueTasks,
  replanTasksForBridgeFailure,
  taskForCitizenAssistance,
  tasksForAction,
} from "./tasks";
import { makeEvent } from "./timeline";
import { generateCitizenInstruction } from "./citizen";
import { computeAfterActionMetrics } from "./afterAction";

export interface ScenarioStore {
  phase: IncidentPhase;
  clockSeconds: number;
  villages: Village[];
  edges: RouteEdge[];
  shelters: Shelter[];
  actions: RecommendedAction[];
  tasks: Task[];
  events: TimelineEvent[];
  citizenInstruction: CitizenInstruction | null;
  citizenResponses: CitizenResponse[];
  bridgeFailed: boolean;
  replans: number;
  afterAction: AfterActionMetrics;
  role: string;
  setRole: (role: string) => void;

  startSimulation: () => void;
  acknowledgeTaskById: (id: string) => void;
  completeTaskById: (id: string) => void;
  failBridge: () => void;
  advanceClock: (minutes: number) => void;
  reportCitizenStatus: (villageId: string, status: CitizenResponse["status"]) => void;
  confirmRecommendation: (actionId: string, role: string) => void;
  rejectRecommendation: (actionId: string, role: string, reason: string) => void;
  resetScenario: () => void;
  tick: () => void;
}

function allocateEvacuationPlan(villages: Village[], edges: RouteEdge[], shelters: Shelter[]) {
  const nextShelters: Shelter[] = shelters.map((s) => ({
    ...s,
    occupied: 0,
    status: s.status === "full" ? "ready" : s.status,
  }));
  const assignments = new Map<string, { routeId: string | null; shelterId: string | null }>();

  [...villages]
    .filter((v) => v.status !== "safe")
    .sort((a, b) => b.riskScore - a.riskScore)
    .forEach((village) => {
      const candidates = edges
        .filter((edge) => edge.from === village.id && edge.status === "open" && edge.to.startsWith("shelter-"))
        .sort((a, b) => a.priority - b.priority);
      const withCapacity = candidates.find((edge) => {
        const shelter = nextShelters.find((item) => item.id === edge.to);
        return shelter && shelter.capacity - shelter.occupied >= village.population;
      });
      const selected = withCapacity ?? candidates[0] ?? null;
      const shelterId = selected ? shelterIdForEdge(selected) : null;
      const shelter = nextShelters.find((item) => item.id === shelterId);

      if (shelter) {
        shelter.occupied += village.population;
        shelter.status = shelter.occupied >= shelter.capacity ? "full" : "ready";
      }
      assignments.set(village.id, { routeId: selected?.id ?? null, shelterId });
    });

  return {
    villages: villages.map((v) => {
      const assignment = assignments.get(v.id);
      return assignment
        ? { ...v, assignedRouteId: assignment.routeId, assignedShelterId: assignment.shelterId }
        : v;
    }),
    shelters: nextShelters,
  };
}

function recomputeMetrics(actions: RecommendedAction[], tasks: Task[], replans: number): AfterActionMetrics {
  return computeAfterActionMetrics(actions, tasks, replans);
}

export const useScenarioStore = create<ScenarioStore>()(persist((set, get) => ({
  phase: "idle",
  clockSeconds: 0,
  villages: INITIAL_VILLAGES,
  edges: INITIAL_EDGES,
  shelters: INITIAL_SHELTERS,
  actions: [],
  tasks: [],
  events: [],
  citizenInstruction: null,
  citizenResponses: [],
  bridgeFailed: false,
  replans: 0,
  afterAction: computeAfterActionMetrics([], [], 0),
  role: "Incident Commander",
  setRole: (role: string) => set({ role }),

  startSimulation: () => {
    const clockSeconds = 0;
    const scored = scoreAllVillages(get().villages, get().edges);
    const generated = generateActions(scored, clockSeconds);

    let newTasks: Task[] = [];
    generated.forEach((a) => {
      const v = scored.find((sv) => sv.id === a.villageId)!;
      newTasks = newTasks.concat(tasksForAction(a, v.name, clockSeconds));
    });

    const allocation = allocateEvacuationPlan(scored, get().edges, get().shelters);
    const villagesWithAssignments = allocation.villages;

    const worst = [...villagesWithAssignments].sort((a, b) => b.riskScore - a.riskScore)[0];
    const worstEdge = worst.assignedRouteId ? get().edges.find((e) => e.id === worst.assignedRouteId) ?? null : null;
    const worstShelter = worst.assignedShelterId
      ? allocation.shelters.find((s) => s.id === worst.assignedShelterId) ?? null
      : null;

    const citizenInstruction = generateCitizenInstruction(worst, worstEdge, worstShelter, 45, false);

    const events: TimelineEvent[] = [
      makeEvent(0, "Warning received", "Extreme rainfall + flash flood alert ingested for district.", "warning"),
      makeEvent(0, "Risk computed", `${generated.length} villages above watch threshold.`, "info"),
      makeEvent(0, "Action plan generated", `${newTasks.length} tasks dispatched across departments.`, "success"),
    ];

    set({
      phase: "recommendation_ready",
      clockSeconds,
      villages: villagesWithAssignments,
      shelters: allocation.shelters,
      actions: generated,
      tasks: newTasks,
      events,
      citizenInstruction,
      citizenResponses: [],
      afterAction: recomputeMetrics(generated, newTasks, 0),
    });
  },

  acknowledgeTaskById: (id: string) => {
    const { tasks, clockSeconds, events } = get();
    const task = tasks.find((t) => t.id === id);
    const updated = acknowledgeTask(tasks, id, clockSeconds);
    set({
      tasks: updated,
      events: task
        ? events.concat(makeEvent(clockSeconds, "Task acknowledged", `${task.department}: ${task.title}`, "info"))
        : events,
      afterAction: recomputeMetrics(get().actions, updated, get().replans),
    });
  },

  completeTaskById: (id: string) => {
    const { tasks, clockSeconds, events } = get();
    const task = tasks.find((t) => t.id === id);
    const updated = completeTaskFn(tasks, id, clockSeconds);
    set({
      tasks: updated,
      events: task
        ? events.concat(makeEvent(clockSeconds, "Task completed", `${task.department}: ${task.title}`, "success"))
        : events,
      afterAction: recomputeMetrics(get().actions, updated, get().replans),
    });
  },

  failBridge: () => {
    const state = get();
    if (state.bridgeFailed) return;
    const clockSeconds = state.clockSeconds + 60;

    const failedEdges = failBridgeEdges(state.edges);
    const rescored = scoreAllVillages(state.villages, failedEdges);

    const allocation = allocateEvacuationPlan(rescored, failedEdges, state.shelters);
    const reassigned = allocation.villages;

    const worst = [...reassigned].sort((a, b) => b.riskScore - a.riskScore)[0];

    // Generate a fresh, superseding action + replan tasks for the worst-affected village
    const newAction = generateActions([worst], clockSeconds)[0];
    const supersededActions = supersedeActionsForVillage(state.actions, worst.id, newAction.id);
    const replanTasks = replanTasksForBridgeFailure(worst.name, clockSeconds);

    const worstEdge = worst.assignedRouteId ? failedEdges.find((e) => e.id === worst.assignedRouteId) ?? null : null;
    const worstShelter = worst.assignedShelterId
      ? allocation.shelters.find((s) => s.id === worst.assignedShelterId) ?? null
      : null;
    const citizenInstruction = generateCitizenInstruction(worst, worstEdge, worstShelter, 30, true);

    const newEvents = state.events.concat([
      makeEvent(clockSeconds, "Bridge-3 failure", "Structural sensor + field report confirms Bridge-3 is impassable.", "critical"),
      makeEvent(clockSeconds, "Route invalidated", "Primary evacuation route via Bridge-3 marked blocked.", "warning"),
      makeEvent(
        clockSeconds,
        "Replan executed",
        `${worst.name} reassigned to ${worstShelter?.name ?? "alternate shelter"} via ${worstEdge?.label ?? "alternate route"}.`,
        "success"
      ),
      makeEvent(clockSeconds, "New tasks generated", `${replanTasks.length} replan tasks dispatched (PWD, Police, Electricity).`, "info"),
    ]);

    const allActions = supersededActions.concat(newAction);
    const allTasks = state.tasks.concat(replanTasks);

    set({
      phase: "disrupted",
      clockSeconds,
      bridgeFailed: true,
      edges: failedEdges,
      villages: reassigned,
      shelters: allocation.shelters,
      actions: allActions,
      tasks: allTasks,
      events: newEvents,
      citizenInstruction,
      replans: state.replans + 1,
      afterAction: recomputeMetrics(allActions, allTasks, state.replans + 1),
    });
  },

  advanceClock: (minutes: number) => {
    const state = get();
    if (state.phase === "idle") return;
    const clockSeconds = state.clockSeconds + minutes * 60;
    const tasks = escalateOverdueTasks(state.tasks, clockSeconds);
    const newlyEscalated = tasks.filter(
      (task) => task.status === "escalated" && state.tasks.find((oldTask) => oldTask.id === task.id)?.status !== "escalated"
    );
    const events = newlyEscalated.length
      ? state.events.concat(
          makeEvent(clockSeconds, "SLA escalation", `${newlyEscalated.length} unacknowledged task(s) escalated.`, "critical")
        )
      : state.events;
    set({
      clockSeconds,
      tasks,
      events,
      afterAction: recomputeMetrics(state.actions, tasks, state.replans),
    });
  },

  reportCitizenStatus: (villageId, status) => {
    const state = get();
    const village = state.villages.find((item) => item.id === villageId);
    if (!village) return;
    const response: CitizenResponse = { villageId, status, reportedAtSec: state.clockSeconds };
    const citizenResponses = state.citizenResponses
      .filter((item) => item.villageId !== villageId)
      .concat(response);
    const alreadyHasAssistanceTask = state.tasks.some(
      (task) => task.reasonCode === "CITIZEN_ASSISTANCE_REQUEST" && task.sourceActionId === `citizen-${villageId}`
    );
    const tasks =
      status === "assistance" && !alreadyHasAssistanceTask
        ? state.tasks.concat(taskForCitizenAssistance(village.name, villageId, state.clockSeconds))
        : state.tasks;
    const label = status === "assistance" ? "Assistance requested" : "Citizen evacuation confirmed";
    const detail =
      status === "assistance"
        ? `${village.name}: mobility / medical help requested; SDRF task created.`
        : `${village.name}: citizen reports evacuation in progress.`;
    set({
      citizenResponses,
      tasks,
      events: state.events.concat(makeEvent(state.clockSeconds, label, detail, status === "assistance" ? "warning" : "success")),
      afterAction: recomputeMetrics(state.actions, tasks, state.replans),
    });
  },

  confirmRecommendation: (actionId, role) => {
    const state = get();
    const action = state.actions.find((a) => a.id === actionId);
    if (!action || action.status !== "proposed") return;
    
    const updatedActions = state.actions.map((a) => 
      a.id === actionId ? { ...a, status: "confirmed" as const, confirmedAtSec: state.clockSeconds, confirmedByRole: role } : a
    );

    const isFirstConfirmation = state.phase === "recommendation_ready";

    set({
      actions: updatedActions,
      phase: isFirstConfirmation ? "response_active" : state.phase,
      events: state.events.concat(makeEvent(state.clockSeconds, "Recommendation confirmed", `${role} approved action: ${action.title}`, "success")),
    });
  },

  rejectRecommendation: (actionId, role, reason) => {
    const state = get();
    const action = state.actions.find((a) => a.id === actionId);
    if (!action || action.status !== "proposed") return;
    
    const updatedActions = state.actions.map((a) => 
      a.id === actionId ? { ...a, status: "rejected" as const, confirmedAtSec: state.clockSeconds, confirmedByRole: role } : a
    );

    set({
      actions: updatedActions,
      events: state.events.concat(makeEvent(state.clockSeconds, "Recommendation rejected", `${role} rejected action: ${action.title}. Reason: ${reason}`, "warning")),
    });
  },

  tick: () => set((s) => ({ clockSeconds: s.clockSeconds + 1 })),

  resetScenario: () =>
    set({
      phase: "idle",
      clockSeconds: 0,
      villages: INITIAL_VILLAGES,
      edges: INITIAL_EDGES,
      shelters: INITIAL_SHELTERS,
      actions: [],
      tasks: [],
      events: [],
      citizenInstruction: null,
      citizenResponses: [],
      bridgeFailed: false,
      replans: 0,
      afterAction: computeAfterActionMetrics([], [], 0),
    }),
}), {
  name: 'sankat-setu-session',
  storage: createJSONStorage(() => sessionStorage),
  version: 1,
}));

