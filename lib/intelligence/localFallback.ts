import { CompareResponse, CopilotResponse, StateSummary, WhatIfChange } from "./types";
import { failBridgeEdges } from "@/lib/scenario/routing";
import { scoreAllVillages } from "@/lib/scenario/risk";
import { RouteEdge, Shelter, Task, Village } from "@/lib/scenario/types";

export function summarize(villages: Village[], edges: RouteEdge[], shelters: Shelter[]): StateSummary {
  const atRisk = villages.filter((village) => village.status !== "safe");
  const populationAtRisk = atRisk.reduce((sum, village) => sum + village.population, 0);
  const availableCapacity = shelters
    .filter((shelter) => shelter.status !== "full")
    .reduce((sum, shelter) => sum + Math.max(0, shelter.capacity - shelter.occupied), 0);
    
  return {
    critical_settlements: villages.filter((village) => village.status === "critical").length,
    population_at_risk: populationAtRisk,
    usable_shelters: shelters.filter((shelter) => shelter.status !== "full").length,
    primary_routes_blocked: edges.filter((edge) => edge.isBridgeDependent && edge.status === "blocked").length,
    rescue_shortfall: populationAtRisk > availableCapacity ? Math.ceil((populationAtRisk - availableCapacity) / 1000) : 0,
  };
}

export function localCompare(
  villages: Village[],
  edges: RouteEdge[],
  shelters: Shelter[],
  change: WhatIfChange
): CompareResponse {
  const before = summarize(villages, edges, shelters);
  let nextVillages = villages;
  let nextEdges = edges;
  let nextShelters = shelters;
  let forcedResourceShortfall = 0;

  if (change.type === "BRIDGE_FAILURE") {
    nextEdges = failBridgeEdges(edges);
    nextVillages = scoreAllVillages(villages, nextEdges);
  } else if (change.type === "RAIN_INTENSITY_CHANGE") {
    const factor = 1 + (change.value_percent ?? 0) / 100;
    nextVillages = scoreAllVillages(
      villages.map((village) => ({ ...village, hazardSeverity: Math.min(1, village.hazardSeverity * factor) })),
      edges
    );
  } else if (change.type === "SHELTER_CLOSURE") {
    nextShelters = shelters.map((shelter) =>
      shelter.id === change.target_id ? { ...shelter, occupied: shelter.capacity, status: "full" as const } : shelter
    );
  } else if (change.type === "RESOURCE_UNAVAILABLE") {
    forcedResourceShortfall = 1;
  }

  const after = summarize(nextVillages, nextEdges, nextShelters);
  after.rescue_shortfall += forcedResourceShortfall;
  
  const delta = Object.fromEntries(
    Object.keys(before).map((key) => [key, after[key as keyof StateSummary] - before[key as keyof StateSummary]])
  );
  
  const narrative: string[] = [];
  if (delta.critical_settlements)
    narrative.push(`${delta.critical_settlements > 0 ? "+" : ""}${delta.critical_settlements} critical settlement(s)`);
  if (delta.population_at_risk)
    narrative.push(`${delta.population_at_risk > 0 ? "+" : ""}${delta.population_at_risk.toLocaleString("en-IN")} people at risk`);
  if (delta.usable_shelters < 0) narrative.push(`${Math.abs(delta.usable_shelters)} fewer usable shelter(s)`);
  if (delta.primary_routes_blocked > 0) narrative.push(`+${delta.primary_routes_blocked} primary route(s) unavailable`);
  if (delta.rescue_shortfall > 0) narrative.push(`+${delta.rescue_shortfall} rescue team shortfall`);
  if (narrative.length === 0) narrative.push("No top-level count changes; operational dependencies still require review.");
  
  return { before, after, delta, narrative, is_simulated: true, source: "local" };
}

export function localCopilot(
  question: string,
  villages: Village[],
  edges: RouteEdge[],
  shelters: Shelter[],
  tasks: Task[]
): CopilotResponse {
  const query = question.toLowerCase();
  const top = [...villages].sort((a, b) => b.riskScore - a.riskScore)[0];
  const blocked = edges.filter((edge) => edge.status === "blocked");
  let answer: string;
  let intent = "UNSUPPORTED";
  const evidence: CopilotResponse["evidence"] = [];

  if (/evacuat|first|priorit/.test(query)) {
    intent = "PRIORITY";
    answer = `${top.name} should be considered first: its current auditable risk score is ${Math.round(top.riskScore * 100)}/100, with ${top.population.toLocaleString("en-IN")} residents exposed, including ${top.vulnerablePopulation} vulnerable people.`;
    evidence.push(
      { key: "risk_score", value: top.riskScore },
      { key: "population", value: top.population },
      { key: "vulnerable_population", value: top.vulnerablePopulation }
    );
  } else if (/route|road|unsafe|blocked/.test(query)) {
    intent = "ROUTE";
    answer = blocked.length
      ? `Currently unsafe routes: ${blocked.map((edge) => edge.label).join("; ")}. Alternate evacuation routing must remain officer-confirmed.`
      : "No route is currently reported blocked. Bridge-3 remains a critical dependency and should be monitored.";
    blocked.forEach((edge) => evidence.push({ key: edge.id, value: edge.status, note: edge.label }));
  } else if (/shelter|overflow|capacity/.test(query)) {
    intent = "CAPACITY";
    const pressured = shelters.filter((shelter) => shelter.occupied / shelter.capacity >= 0.9);
    answer = pressured.length
      ? `${pressured.map((shelter) => shelter.name).join(", ")} is at or above 90% assigned capacity. Review split allocation before dispatch.`
      : "No shelter is currently at 90% assigned capacity. Capacity must still be verified by field staff before dispatch.";
    shelters.forEach((shelter) =>
      evidence.push({ key: shelter.id, value: shelter.capacity - shelter.occupied, unit: "places", note: "available planned capacity" })
    );
  } else if (/brief|summary|situation/.test(query)) {
    intent = "SUMMARY";
    const openTasks = tasks.filter((task) => task.status !== "completed").length;
    answer = `Situation brief: ${villages.filter((village) => village.status === "critical").length} critical settlement(s), ${villages.filter((village) => village.status !== "safe").reduce((sum, village) => sum + village.population, 0).toLocaleString("en-IN")} people at risk, ${blocked.length} blocked road(s), and ${openTasks} open department task(s). Top action: prioritise ${top.name}.`;
    evidence.push({ key: "open_tasks", value: openTasks }, { key: "blocked_routes", value: blocked.length });
  } else if (/resource|sdrf|rescue|send/.test(query)) {
    intent = "RESOURCE";
    answer = `Prioritise the nearest available rescue team for ${top.name}, while retaining the second team for route disruption or citizen assistance. Exact ETA remains a simulated roster value.`;
    evidence.push({ key: "top_priority_settlement", value: top.name }, { key: "available_rescue_teams", value: 2 });
  } else {
    answer =
      "I can answer from structured scenario data about evacuation priority, route status, shelter capacity, response resources, data trust and situation summaries. I will not invent unsupported emergency facts.";
  }

  return {
    answer,
    evidence,
    confidence: intent === "UNSUPPORTED" ? 0 : 0.9,
    data_gaps: [],
    reason_codes: intent === "PRIORITY" ? ["HIGH_HAZARD_EXPOSURE"] : [],
    intent,
    status: "REQUIRES OFFICER CONFIRMATION",
    source: "local",
  };
}
