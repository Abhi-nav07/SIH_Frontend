// MockScenarioProvider (V0.3 spec item 11).
//
// Wraps the EXISTING scenario store/logic (lib/scenario/store.ts,
// lib/scenario/data.ts) read-only — no changes to those files. This lets
// the app keep working when the backend is offline, and gives the new
// ScenarioDataProvider abstraction something to resolve against today.
//
// Caveat, stated plainly: the V0.2 domain model (Village, RouteEdge, ...)
// uses SVG canvas coordinates (x/y) for the prototype map, not real
// lat/lon. Converting those into the shared GeoJSON-shaped ScenarioState
// contract below is a best-effort placeholder mapping purely so the type
// contract lines up end-to-end — it is NOT a real geographic transform.
// Every record is marked source: "mock-provider", is_simulated: true so
// this is never mistaken for verified data.

import { useScenarioStore } from "../scenario/store";
import type {
  Bridge,
  ConfidenceInfo,
  FreshnessInfo,
  Hospital,
  Provenance,
  ResponseResource,
  RoadSegment,
  ScenarioState,
  Settlement,
  Shelter,
} from "../../shared/types";
import type { ScenarioAssets, ScenarioDataProvider, ScenarioEvent } from "./types";

const MOCK_PROVENANCE = (): Provenance => ({
  source: "mock-provider",
  received_at: new Date().toISOString(),
  observed_at: new Date().toISOString(),
  is_simulated: true,
});

const MOCK_FRESHNESS: FreshnessInfo = { status: "FRESH" };
const MOCK_CONFIDENCE: ConfidenceInfo = { score: 60, reason: "mock provider — no real freshness/conflict data" };

// SVG canvas is ~900x540 (see components/map/RiskMap.tsx); spread that
// loosely across a plausible Uttarakhand-ish bounding box. Placeholder only
// — see module docstring above.
function svgToLonLat(x: number, y: number): [number, number] {
  const lon = 78.2 + (x / 900) * 0.5;
  const lat = 30.2 - (y / 540) * 0.3;
  return [lon, lat];
}

function toSettlement(v: ReturnType<typeof useScenarioStore.getState>["villages"][number]): Settlement {
  const [lon, lat] = svgToLonLat(v.x, v.y);
  return {
    id: v.id,
    name: v.name,
    district: "Uttarakhand",
    state: "Uttarakhand",
    population: v.population,
    vulnerable_population: v.vulnerablePopulation,
    location: { type: "Point", coordinates: [lon, lat] },
    provenance: MOCK_PROVENANCE(),
  };
}

function toShelter(s: ReturnType<typeof useScenarioStore.getState>["shelters"][number]): Shelter {
  const [lon, lat] = svgToLonLat(s.x, s.y);
  return {
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    occupied: s.occupied,
    operational_status: s.status === "full" ? "limited" : "operational",
    location: { type: "Point", coordinates: [lon, lat] },
    provenance: MOCK_PROVENANCE(),
    freshness: MOCK_FRESHNESS,
  };
}

function toRoadSegment(e: ReturnType<typeof useScenarioStore.getState>["edges"][number]): RoadSegment {
  return {
    id: e.id,
    name: e.label,
    status: e.status === "open" ? "open" : "blocked",
    conflicting_sources: null,
    depends_on_bridge_id: e.isBridgeDependent ? "bridge-3" : null,
    provenance: MOCK_PROVENANCE(),
    freshness: MOCK_FRESHNESS,
    confidence: MOCK_CONFIDENCE,
  };
}

// The mock store has no standalone Bridge/Hospital/ResponseResource
// entities (Bridge-3 is baked into edges/dependencies, and hospital/
// resources aren't modeled in lib/scenario/data.ts at all) — return
// deterministic placeholders so the ScenarioAssets shape is always
// complete, clearly marked as mock/simulated.
function placeholderBridge(edges: ReturnType<typeof useScenarioStore.getState>["edges"]): Bridge {
  const dependent = edges.filter((e) => e.isBridgeDependent).map((e) => e.id);
  const anyBlocked = edges.some((e) => e.isBridgeDependent && e.status === "blocked");
  return {
    id: "bridge-3",
    name: "Bridge-3",
    status: anyBlocked ? "blocked" : "open",
    location: { type: "Point", coordinates: svgToLonLat(415, 320) },
    conflicting_sources: null,
    dependent_route_ids: dependent,
    provenance: MOCK_PROVENANCE(),
    freshness: MOCK_FRESHNESS,
    confidence: MOCK_CONFIDENCE,
  };
}

function placeholderHospital(): Hospital {
  return {
    id: "hospital",
    name: "District Hospital",
    emergency_beds: 40,
    available_beds: 28,
    operational_status: "operational",
    location: { type: "Point", coordinates: svgToLonLat(155, 375) },
    provenance: MOCK_PROVENANCE(),
    freshness: MOCK_FRESHNESS,
  };
}

function placeholderResources(): ResponseResource[] {
  return [
    { id: "r1", type: "rescue_team", agency: "SDRF", quantity: 1, availability: "available", status: "ready", location: { type: "Point", coordinates: svgToLonLat(155, 405) }, provenance: MOCK_PROVENANCE(), freshness: MOCK_FRESHNESS },
    { id: "r2", type: "rescue_team", agency: "SDRF", quantity: 1, availability: "available", status: "ready", location: { type: "Point", coordinates: svgToLonLat(700, 322) }, provenance: MOCK_PROVENANCE(), freshness: MOCK_FRESHNESS },
  ];
}

export class MockScenarioProvider implements ScenarioDataProvider {
  async getScenario(id: string): Promise<ScenarioState> {
    const state = useScenarioStore.getState();
    const now = new Date().toISOString();
    return {
      scenario: {
        id,
        name: "Uttarakhand Flash-Flood Vertical Slice (mock)",
        district: "Uttarakhand",
        phase: state.villages.some((v) => v.status === "critical") ? "active" : "idle",
        clock_seconds: state.clockSeconds ?? 0,
        is_simulated: true,
        created_at: now,
        updated_at: now,
      },
      active_alerts: [],
      settlements: state.villages.map(toSettlement),
      roads: state.edges.map(toRoadSegment),
      bridges: [placeholderBridge(state.edges)],
      shelters: state.shelters.map(toShelter),
      hospitals: [placeholderHospital()],
      resources: placeholderResources(),
      generated_at: now,
    };
  }

  async getAssets(id: string): Promise<ScenarioAssets> {
    const full = await this.getScenario(id);
    return {
      roads: full.roads,
      bridges: full.bridges,
      shelters: full.shelters,
      hospitals: full.hospitals,
      resources: full.resources,
    };
  }

  async pushEvent(_id: string, event: ScenarioEvent): Promise<void> {
    // The mock provider is read-only with respect to the real store — it
    // does not call store actions (that stays V0.2's job via its own UI
    // buttons) — it just logs, so callers exercising the provider contract
    // against mock data don't silently no-op without any signal.
    console.info("[MockScenarioProvider] pushEvent (no-op against live store)", event);
  }
}
