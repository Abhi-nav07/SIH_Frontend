import { StateSummary, WhatIfChange } from "./types";

export const QUICK_QUESTIONS = [
  "Which village should evacuate first?",
  "Which routes are unsafe?",
  "Will any shelter overflow?",
  "Give me a 30-second situation brief.",
];

export const WHAT_IF_OPTIONS: { id: string; label: string; description: string; change: WhatIfChange }[] = [
  { id: "bridge", label: "Bridge-3 fails", description: "Invalidate all bridge-dependent routes", change: { type: "BRIDGE_FAILURE", target_id: "bridge-3" } },
  { id: "rain", label: "Rain intensity +25%", description: "Rescale settlement hazard severity", change: { type: "RAIN_INTENSITY_CHANGE", value_percent: 25 } },
  { id: "shelter", label: "Shelter B closes", description: "Remove Hill Camp evacuation capacity", change: { type: "SHELTER_CLOSURE", target_id: "shelter-b" } },
  { id: "resource", label: "Rescue Team R1 unavailable", description: "Test response resource resilience", change: { type: "RESOURCE_UNAVAILABLE", target_id: "r1" } },
];

export const SUMMARY_FIELDS: { key: keyof StateSummary; label: string }[] = [
  { key: "critical_settlements", label: "Critical zones" },
  { key: "population_at_risk", label: "People at risk" },
  { key: "usable_shelters", label: "Usable shelters" },
  { key: "primary_routes_blocked", label: "Blocked routes" },
  { key: "rescue_shortfall", label: "Team shortfall" },
];
