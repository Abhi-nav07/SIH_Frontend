import { StateSummary, WhatIfChange } from "./types";

export const QUICK_QUESTIONS = [
  "Which settlement should evacuate first?",
  "Why is this settlement prioritised?",
  "Which routes are blocked?",
  "Which shelter may exceed capacity?",
  "Which rescue team should move next?",
  "Which tasks are overdue?",
  "What changed after Bridge-3 failed?",
  "Which data is stale or low-confidence?",
  "Give a 30-second command brief.",
];

export const WHAT_IF_OPTIONS: { id: string; label: string; description: string; change: WhatIfChange }[] = [
  { id: "bridge", label: "Bridge-3 fails", description: "Invalidate all bridge-dependent routes", change: { type: "BRIDGE_FAILURE", target_id: "bridge-3" } },
  { id: "rain", label: "Rain intensity +25%", description: "Rescale settlement hazard severity", change: { type: "RAIN_INTENSITY_CHANGE", value_percent: 25 } },
  { id: "shelter", label: "Shelter B closes", description: "Remove Hill Camp evacuation capacity", change: { type: "SHELTER_CLOSURE", target_id: "shelter-b" } },
  { id: "resource", label: "Rescue Team R1 unavailable", description: "Test response resource resilience", change: { type: "RESOURCE_UNAVAILABLE", target_id: "r1" } },
  { id: "road_blockage", label: "Road blockage", description: "District Hospital Road becomes impassable", change: { type: "ROAD_BLOCKAGE", target_id: "dh-road" } },
  { id: "hospital_access", label: "Hospital access degradation", description: "District hospital beds reduced by 50%", change: { type: "HOSPITAL_DEGRADATION", target_id: "hospital-1" } },
  { id: "population_exposure", label: "Population exposure increase", description: "Refugees increase local risk by 1000", change: { type: "POP_INCREASE", target_id: "village-alpha" } },
];

export const SUMMARY_FIELDS: { key: keyof StateSummary; label: string }[] = [
  { key: "critical_settlements", label: "Critical zones" },
  { key: "population_at_risk", label: "People at risk" },
  { key: "usable_shelters", label: "Usable shelters" },
  { key: "primary_routes_blocked", label: "Blocked routes" },
  { key: "rescue_shortfall", label: "Team shortfall" },
];
