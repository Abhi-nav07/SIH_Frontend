// Central typed domain model. UI never invents shapes of its own —
// everything the interface renders comes from here so real data adapters
// can later replace the simulated feeds without touching components.

export type Severity = "safe" | "watch" | "critical";

export interface Village {
  id: string;
  name: string;
  x: number; // svg coords, prototype-only
  y: number;
  population: number;
  vulnerablePopulation: number; // elderly, disabled, children
  hazardSeverity: number; // 0-1, input feed
  status: Severity;
  riskScore: number; // computed
  assignedShelterId: string | null;
  assignedRouteId: string | null;
}

export type EdgeStatus = "open" | "blocked";

export interface RouteEdge {
  id: string;
  label: string;
  from: string; // node id (village/bridge/shelter/hospital)
  to: string;
  path: string; // svg path d for the prototype map
  status: EdgeStatus;
  isBridgeDependent: boolean;
  priority: number; // lower is preferred by the deterministic route planner
}

export interface Shelter {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  occupied: number;
  status: "ready" | "standby" | "full";
}

export type Department =
  | "DDMA"
  | "Police"
  | "SDRF"
  | "Health"
  | "PWD"
  | "Transport"
  | "Electricity";

export type TaskStatus = "draft" | "dispatched" | "pending" | "acknowledged" | "in_progress" | "blocked" | "escalated" | "completed" | "cancelled" | "superseded";

export interface Task {
  id: string;
  title: string;
  department: Department;
  priority: "P1" | "P2" | "P3";
  status: TaskStatus;
  reasonCode: string;
  createdAtSec: number;
  ackAtSec: number | null;
  completedAtSec: number | null;
  slaSeconds: number;
  sourceActionId: string;
  generatedByReplan: boolean;
}

export type RecommendationStatus = "proposed" | "under_review" | "confirmed" | "rejected" | "superseded";

export interface RecommendedAction {
  id: string;
  villageId: string;
  title: string;
  reason: string;
  riskScore: number;
  windowMinutes: number;
  reasonCode: string;
  createdAtSec: number;
  supersededBy: string | null;
  status: RecommendationStatus;
  confirmedAtSec: number | null;
  confirmedByRole: string | null;
}

export interface TimelineEvent {
  id: string;
  atSec: number;
  label: string;
  detail: string;
  kind: "info" | "warning" | "critical" | "success";
  eventType?: "scenario" | "alert" | "analysis" | "recommendation" | "confirmation" | "task" | "citizen" | "infrastructure" | "replan" | "escalation" | "verification" | "report";
  relatedEntityIds?: string[];
  source?: string;
  actorRole?: string;
  simulatedStatus?: string;
}

export interface CitizenInstruction {
  villageId: string;
  villageName: string;
  riskLevel: Severity;
  shelterName: string;
  routeDescription: string;
  leaveBeforeMinutes: number;
  changedByReplan: boolean;
}

export interface CitizenResponse {
  villageId: string;
  status: "evacuating" | "assistance";
  reportedAtSec: number;
}

export type IncidentPhase = 
  | "idle" 
  | "alert_received" 
  | "analysing" 
  | "recommendation_ready" 
  | "response_active" 
  | "disrupted" 
  | "replanning" 
  | "replanned" 
  | "stabilising" 
  | "exercise_complete";

export type DataFreshness = "current" | "ageing" | "stale" | "unknown";


export interface AfterActionMetrics {
  actionsGenerated: number;
  actionsCompleted: number;
  criticalReplans: number;
  avgAckSeconds: number | null;
  avgCompleteSeconds: number | null;
  coordinationScore: number | null; // 0-100
}
