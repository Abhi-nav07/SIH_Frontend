import { RecommendedAction, Village } from "./types";

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Generates prioritized, explainable actions for villages above the "watch" threshold. */
export function generateActions(villages: Village[], atSec: number): RecommendedAction[] {
  return villages
    .filter((v) => v.status !== "safe")
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((v) => {
      const urgent = v.status === "critical";
      return {
        id: nextId("act"),
        villageId: v.id,
        title: urgent ? `Evacuate ${v.name}` : `Prepare ${v.name} for possible evacuation`,
        reason: urgent
          ? `Hazard severity ${(v.hazardSeverity * 100).toFixed(0)}%, ${v.population.toLocaleString()} residents exposed (${v.vulnerablePopulation} vulnerable), rising route risk.`
          : `Hazard trending upward; monitor route and shelter capacity before escalation.`,
        riskScore: v.riskScore,
        windowMinutes: urgent ? 45 : 120,
        reasonCode: urgent ? "HAZARD_HIGH_ROUTE_AT_RISK" : "HAZARD_TRENDING_WATCH",
        createdAtSec: atSec,
        supersededBy: null,
        status: "proposed",
        confirmedAtSec: null,
        confirmedByRole: null,
      };
    });
}

/** Marks earlier actions for a village superseded when a replan produces a new one. */
export function supersedeActionsForVillage(
  actions: RecommendedAction[],
  villageId: string,
  newActionId: string
): RecommendedAction[] {
  return actions.map((a) =>
    a.villageId === villageId && a.id !== newActionId && a.supersededBy === null
      ? { ...a, supersededBy: newActionId, status: "superseded" }
      : a
  );
}
