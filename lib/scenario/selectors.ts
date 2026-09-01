import { ScenarioStore } from "./store";
import { routesValidCount } from "./routing";
import { Village, Task, CitizenResponse, RecommendedAction } from "./types";

export const selectPopulationRisk = (state: ScenarioStore) => 
  state.villages.filter((v: Village) => v.status !== "safe").reduce((sum: number, v: Village) => sum + v.population, 0);

export const selectCriticalZones = (state: ScenarioStore) => 
  state.villages.filter((v: Village) => v.status === "critical").length;

export const selectRoadsBlocked = (state: ScenarioStore) => {
  const { open, total } = routesValidCount(state.edges);
  return total - open;
};

export const selectRoadsTotal = (state: ScenarioStore) => {
  const { total } = routesValidCount(state.edges);
  return total;
};

export const selectRoadsOpen = (state: ScenarioStore) => {
  const { open } = routesValidCount(state.edges);
  return open;
};

export const selectOpenActions = (state: ScenarioStore) => 
  state.tasks.filter((t: Task) => t.status !== "completed").length;

export const selectAssistRequests = (state: ScenarioStore) => 
  state.citizenResponses.filter((r: CitizenResponse) => r.status === "assistance").length;

export const selectTopActionConfidence = (state: ScenarioStore) => {
  const liveActions = state.actions.filter((action: RecommendedAction) => action.status === "proposed" || action.status === "confirmed").sort((a: RecommendedAction, b: RecommendedAction) => b.riskScore - a.riskScore);
  const top = liveActions[0];
  if (!top) return 0;
  return Math.min(99, Math.round(top.riskScore * 100) + 15);
};
