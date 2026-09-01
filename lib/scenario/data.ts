import { RouteEdge, Shelter, Village } from "./types";

// All numbers below are illustrative demo inputs for the Uttarakhand
// flash-flood vertical slice. NOT validated hazard data. See MASTER_SPEC §5.

export const INITIAL_VILLAGES: Village[] = [
  {
    id: "alpha",
    name: "Village Alpha",
    x: 260,
    y: 210,
    population: 1450,
    vulnerablePopulation: 220,
    hazardSeverity: 0.9,
    status: "safe",
    riskScore: 0,
    assignedShelterId: null,
    assignedRouteId: null,
  },
  {
    id: "beta",
    name: "Village Beta",
    x: 430,
    y: 350,
    population: 980,
    vulnerablePopulation: 140,
    hazardSeverity: 0.62,
    status: "safe",
    riskScore: 0,
    assignedShelterId: null,
    assignedRouteId: null,
  },
  {
    id: "gamma",
    name: "Village Gamma",
    x: 585,
    y: 250,
    population: 640,
    vulnerablePopulation: 95,
    hazardSeverity: 0.35,
    status: "safe",
    riskScore: 0,
    assignedShelterId: null,
    assignedRouteId: null,
  },
  {
    id: "delta",
    name: "Village Delta",
    x: 708,
    y: 228,
    population: 510,
    vulnerablePopulation: 60,
    hazardSeverity: 0.22,
    status: "safe",
    riskScore: 0,
    assignedShelterId: null,
    assignedRouteId: null,
  },
];

export const INITIAL_SHELTERS: Shelter[] = [
  { id: "shelter-a", name: "Shelter A — Govt School", x: 780, y: 116, capacity: 1600, occupied: 0, status: "ready" },
  { id: "shelter-b", name: "Shelter B — Hill Camp", x: 720, y: 386, capacity: 2600, occupied: 0, status: "standby" },
];

// Route graph. "main-alpha-a" depends on Bridge-3; when the bridge fails
// this edge is blocked and routing.ts must recompute an alternate.
export const INITIAL_EDGES: RouteEdge[] = [
  {
    id: "main-alpha-a",
    label: "Main Road (Alpha → Bridge-3 → Shelter A)",
    from: "alpha",
    to: "shelter-a",
    path: "M260,210 C300,190 350,260 397,310 L435,318 C560,300 690,180 780,116",
    status: "open",
    isBridgeDependent: true,
    priority: 1,
  },
  {
    id: "secondary-alpha-b",
    label: "Secondary Road (Alpha → Shelter B, longer)",
    from: "alpha",
    to: "shelter-b",
    path: "M260,210 C300,300 360,360 430,350 C560,380 650,390 720,386",
    status: "open",
    isBridgeDependent: false,
    priority: 2,
  },
  {
    id: "main-beta-a",
    label: "Main Road (Beta → Bridge-3 → Shelter A)",
    from: "beta",
    to: "shelter-a",
    path: "M430,350 C400,330 415,320 435,318 C560,300 690,180 780,116",
    status: "open",
    isBridgeDependent: true,
    priority: 1,
  },
  {
    id: "secondary-beta-b",
    label: "Hill Road (Beta → Shelter B, longer)",
    from: "beta",
    to: "shelter-b",
    path: "M430,350 C520,365 620,382 720,386",
    status: "open",
    isBridgeDependent: false,
    priority: 2,
  },
  {
    id: "hospital-link",
    label: "Hospital Access Road",
    from: "beta",
    to: "hospital",
    path: "M430,350 C330,375 250,380 190,375",
    status: "open",
    isBridgeDependent: false,
    priority: 1,
  },
];

export const BRIDGE = { id: "bridge-3", name: "Bridge-3", x: 397, y: 310 };
export const HOSPITAL = { id: "hospital", name: "District Hospital", x: 150, y: 375 };
export const RESCUE_TEAMS = [
  { id: "r1", name: "Rescue Team R1", x: 155, y: 405 },
  { id: "r2", name: "Rescue Team R2", x: 700, y: 322 },
];

export const DEMO_DISCLAIMER =
  "Prototype logic is deterministic and transparent for demonstration purposes only — it is not a scientifically validated emergency risk model.";
