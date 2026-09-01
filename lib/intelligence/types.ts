export interface Provenance {
  source: string;
  observed_at: string;
  confidence: number;
  is_simulated: boolean;
}

export interface ScenarioSnapshot {
  scenario_id: string;
  timestamp: string;
  alerts: Array<{ id: string; headline: string; hazard_type: string; rain_intensity_percent: number; provenance: Provenance }>;
  settlements: Array<Record<string, unknown>>;
  roads: Array<Record<string, unknown>>;
  bridges: Array<Record<string, unknown>>;
  shelters: Array<Record<string, unknown>>;
  hospitals: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
  active_tasks: Array<Record<string, unknown>>;
  historical_events: Array<Record<string, unknown>>;
  source_metadata: { generated_by: string; schema_version: string; notes: string };
}

export interface CopilotResponse {
  answer: string;
  evidence: Array<{ key: string; value: unknown; unit?: string; note?: string }>;
  confidence: number;
  data_gaps: Array<{ subject: string; description: string }>;
  reason_codes: string[];
  intent: string;
  status: string;
  source?: "service" | "local";
}

export interface StateSummary {
  critical_settlements: number;
  population_at_risk: number;
  usable_shelters: number;
  primary_routes_blocked: number;
  rescue_shortfall: number;
}

export interface CompareResponse {
  before: StateSummary;
  after: StateSummary;
  delta: Record<string, number>;
  narrative: string[];
  is_simulated: boolean;
  source?: "service" | "local";
}

export type WhatIfChange = {
  type: "BRIDGE_FAILURE" | "RAIN_INTENSITY_CHANGE" | "SHELTER_CLOSURE" | "RESOURCE_UNAVAILABLE" | "ROAD_BLOCKAGE" | "HOSPITAL_DEGRADATION" | "POP_INCREASE";
  target_id?: string;
  value_percent?: number;
};
