import { BRIDGE, HOSPITAL, RESCUE_TEAMS } from "@/lib/scenario/data";
import { RouteEdge, Shelter, Task, TimelineEvent, Village } from "@/lib/scenario/types";
import { ScenarioSnapshot } from "./types";

const provenance = (source: string, confidence = 0.92) => ({
  source,
  observed_at: new Date().toISOString(),
  confidence,
  is_simulated: true,
});

export function buildScenarioSnapshot({
  villages,
  edges,
  shelters,
  tasks,
  events,
  bridgeFailed,
}: {
  villages: Village[];
  edges: RouteEdge[];
  shelters: Shelter[];
  tasks: Task[];
  events: TimelineEvent[];
  bridgeFailed: boolean;
}): ScenarioSnapshot {
  return {
    scenario_id: "UK_FF_001",
    timestamp: new Date().toISOString(),
    alerts: [{ id: "alert-rain-01", headline: "Extreme rainfall + flash-flood risk", hazard_type: "flood", rain_intensity_percent: 0, provenance: provenance("simulated weather feed") }],
    settlements: villages.map((village) => ({
      id: village.id,
      name: village.name,
      population: village.population,
      vulnerable_population: village.vulnerablePopulation,
      hazard_severity: village.hazardSeverity,
      status: village.status,
      risk_score: village.riskScore,
      assigned_shelter_id: village.assignedShelterId,
      assigned_route_id: village.assignedRouteId,
      provenance: provenance("scenario seed"),
    })),
    roads: edges.map((edge) => ({ id: edge.id, label: edge.label, from: edge.from, to: edge.to, status: edge.status, is_bridge_dependent: edge.isBridgeDependent, bridge_id: edge.isBridgeDependent ? BRIDGE.id : null, provenance: provenance("road graph + field status") })),
    bridges: [{ id: BRIDGE.id, name: BRIDGE.name, status: bridgeFailed ? "blocked" : "open", provenance: provenance(bridgeFailed ? "simulated field report" : "infrastructure inventory") }],
    shelters: shelters.map((shelter) => ({ id: shelter.id, name: shelter.name, capacity: shelter.capacity, occupied: shelter.occupied, status: shelter.status, provenance: provenance("DDMP shelter inventory") })),
    hospitals: [{ id: HOSPITAL.id, name: HOSPITAL.name, capacity: 120, accessible: true, provenance: provenance("health department roster", 0.88) }],
    resources: RESCUE_TEAMS.map((team, index) => ({ id: team.id, name: team.name, kind: "rescue_team", available: true, current_assignment_settlement_id: null, eta_minutes_by_settlement: { alpha: 12 + index * 5, beta: 18 - index * 3 }, provenance: provenance("SDRF roster", 0.9) })),
    active_tasks: tasks.map((task) => ({ id: task.id, title: task.title, department: task.department, priority: task.priority, status: task.status, reason_code: task.reasonCode, created_at_sec: task.createdAtSec, sla_seconds: task.slaSeconds })),
    historical_events: events.map((event) => ({ id: event.id, label: event.label, detail: event.detail })),
    source_metadata: { generated_by: "sankat-setu-frontend", schema_version: "0.4.0", notes: "Illustrative exercise snapshot" },
  };
}
