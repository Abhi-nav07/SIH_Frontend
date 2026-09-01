// Shared frontend/backend type contract (V0.3 spec item 10).
//
// Mirrors backend/app/schemas/*.py field-for-field. This is hand-maintained
// rather than OpenAPI-generated for now (no network access to run an
// OpenAPI codegen tool in this environment) — see V0_3_MERGE_NOTES.md.
// Once the backend runs, prefer regenerating this from
// GET /openapi.json to keep it verifiably in sync.
//
// These are the *backend's* domain types — distinct from, and not a
// replacement for, the existing frontend-only types in
// lib/scenario/types.ts (Village, Task, RecommendedAction, etc.), which
// remain the source of truth for V0.2's client-side decision engine.

export type Freshness = "FRESH" | "STALE" | "EXPIRED" | "UNKNOWN";

export interface FreshnessInfo {
  status: Freshness;
  age_hours?: number | null;
}

export interface ConfidenceInfo {
  score: number; // 0-100
  reason: string;
}

export interface Provenance {
  source: string;
  source_id?: string | null;
  observed_at?: string | null; // ISO datetime
  received_at: string;
  last_verified_at?: string | null;
  verified_by?: string | null;
  is_simulated: boolean;
}

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lon, lat]
}

// ---- Disaster events -------------------------------------------------

export type HazardType =
  | "flood"
  | "extreme_rainfall"
  | "landslide"
  | "earthquake"
  | "wildfire"
  | "cyclone"
  | "generic";

export type EventSeverity = "minor" | "moderate" | "severe" | "extreme";
export type Certainty = "observed" | "likely" | "possible" | "unknown";
export type AlertLifecycle = "new" | "update" | "cancel" | "expire";
export type AlertLifecycleStatus = "pending" | "active" | "expired" | "cancelled";

export interface DisasterEvent {
  id: number;
  source_event_id: string;
  lifecycle: AlertLifecycle;
  hazard_type: HazardType;
  severity: EventSeverity;
  certainty: Certainty;
  headline: string;
  description: string;
  issued_at: string;
  effective_from: string;
  expires_at?: string | null;
  affected_area?: string | null;
  supersedes_id?: number | null;
  lifecycle_status: AlertLifecycleStatus;
  provenance: Provenance;
}

// ---- Geographic assets -------------------------------------------------

export type RoadStatus = "open" | "restricted" | "blocked" | "conflict" | "unknown";
export type OperationalStatus = "operational" | "limited" | "non_operational" | "unknown";

export interface Settlement {
  id: string;
  name: string;
  district: string;
  state: string;
  population: number;
  vulnerable_population: number;
  location: GeoPoint;
  provenance: Provenance;
}

export interface RoadSegment {
  id: string;
  name: string;
  status: RoadStatus;
  conflicting_sources: Array<Record<string, unknown>> | null;
  depends_on_bridge_id: string | null;
  provenance: Provenance;
  freshness: FreshnessInfo;
  confidence: ConfidenceInfo;
}

export interface Bridge {
  id: string;
  name: string;
  status: RoadStatus;
  location: GeoPoint;
  conflicting_sources: Array<Record<string, unknown>> | null;
  dependent_route_ids: string[];
  provenance: Provenance;
  freshness: FreshnessInfo;
  confidence: ConfidenceInfo;
}

export interface Shelter {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  operational_status: OperationalStatus;
  accessibility?: string | null;
  location: GeoPoint;
  provenance: Provenance;
  freshness: FreshnessInfo;
}

export interface Hospital {
  id: string;
  name: string;
  emergency_beds: number;
  available_beds: number;
  operational_status: OperationalStatus;
  location: GeoPoint;
  provenance: Provenance;
  freshness: FreshnessInfo;
}

export interface ResponseResource {
  id: string;
  type: string;
  agency: string;
  quantity: number;
  availability: string;
  status: string;
  location: GeoPoint;
  provenance: Provenance;
  freshness: FreshnessInfo;
}

export interface VerifyAssetRequest {
  status: string;
  verified_by: string;
  observed_at: string; // ISO datetime
  notes?: string | null;
}

export interface VerifyAssetResponse {
  asset_type: "road_segment" | "bridge";
  asset_id: string;
  status: string;
  verified_by: string;
  superseded_conflict: boolean;
  confidence: ConfidenceInfo;
}

// ---- Scenario -------------------------------------------------

export type ScenarioPhase = "idle" | "warning" | "active" | "replanned";

export interface ScenarioSummary {
  id: string;
  name: string;
  district: string;
  phase: ScenarioPhase;
  clock_seconds: number;
  is_simulated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScenarioState {
  scenario: ScenarioSummary;
  active_alerts: DisasterEvent[];
  settlements: Settlement[];
  roads: RoadSegment[];
  bridges: Bridge[];
  shelters: Shelter[];
  hospitals: Hospital[];
  resources: ResponseResource[];
  generated_at: string;
}

export type ScenarioEventKind =
  | "ALERT_RECEIVED"
  | "ALERT_UPDATED"
  | "ROAD_BLOCKED"
  | "BRIDGE_STATUS_CHANGED"
  | "SHELTER_CAPACITY_CHANGED"
  | "RESOURCE_STATUS_CHANGED"
  | "DATA_CONFLICT"
  | "DATA_STALE";

export interface ScenarioEventIn {
  kind: ScenarioEventKind;
  asset_id?: string | null;
  payload?: Record<string, unknown>;
  source?: string;
}

export interface ScenarioSnapshotSummary {
  id: number;
  scenario_id: string;
  reason: string;
  created_at: string;
}

export interface ScenarioSnapshotDetail extends ScenarioSnapshotSummary {
  state: ScenarioState;
}

// Message shape delivered over the SSE stream at
// GET /api/v1/scenarios/{id}/stream (event: "scenario_update").
export interface StreamMessage {
  kind: ScenarioEventKind;
  payload: Record<string, unknown>;
  at: string;
}
