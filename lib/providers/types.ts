// Frontend data-provider abstraction (V0.3 spec item 11).
//
// This is a NEW, additive abstraction — it does not replace or rewire the
// existing pages (app/page.tsx, app/tasks/page.tsx, etc.), which continue
// to read from lib/scenario/store.ts (the Zustand store) exactly as before.
// Wiring a page to use a provider instead of the store directly is future
// work, left to V0.2/whoever owns the frontend, so this stays merge-safe.
//
// Shape matches /shared/types.ts, which mirrors the backend's Pydantic
// schemas — so ApiScenarioProvider can return backend responses unmodified.

import type { ScenarioEventKind, ScenarioState } from "../../shared/types";

export interface ScenarioAssets {
  roads: ScenarioState["roads"];
  bridges: ScenarioState["bridges"];
  shelters: ScenarioState["shelters"];
  hospitals: ScenarioState["hospitals"];
  resources: ScenarioState["resources"];
}

export interface ScenarioEvent {
  kind: ScenarioEventKind;
  assetId?: string | null;
  payload?: Record<string, unknown>;
  source?: string;
}

export interface ScenarioDataProvider {
  getScenario(id: string): Promise<ScenarioState>;
  getAssets(id: string): Promise<ScenarioAssets>;
  pushEvent(id: string, event: ScenarioEvent): Promise<void>;
}
