// ApiScenarioProvider (V0.3 spec item 11).
//
// Thin fetch wrapper over the FastAPI backend's scenario endpoints. Returns
// backend responses as-is (they already match /shared/types.ts) — no
// reshaping needed since the shared contract was written to mirror the
// Pydantic schemas directly.

import type { ScenarioState } from "../../shared/types";
import type { ScenarioAssets, ScenarioDataProvider, ScenarioEvent } from "./types";

export interface ApiScenarioProviderOptions {
  baseUrl?: string; // defaults to NEXT_PUBLIC_API_BASE_URL or http://localhost:8000
  fetchImpl?: typeof fetch;
}

export class ApiScenarioProvider implements ScenarioDataProvider {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(options: ApiScenarioProviderOptions = {}) {
    this.baseUrl =
      options.baseUrl ??
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined) ??
      "http://localhost:8000";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`ApiScenarioProvider: GET ${path} failed with ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async getScenario(id: string): Promise<ScenarioState> {
    return this.get<ScenarioState>(`/api/v1/scenarios/${encodeURIComponent(id)}/state`);
  }

  async getAssets(id: string): Promise<ScenarioAssets> {
    const state = await this.getScenario(id);
    return {
      roads: state.roads,
      bridges: state.bridges,
      shelters: state.shelters,
      hospitals: state.hospitals,
      resources: state.resources,
    };
  }

  async pushEvent(id: string, event: ScenarioEvent): Promise<void> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/v1/scenarios/${encodeURIComponent(id)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: event.kind,
        asset_id: event.assetId ?? null,
        payload: event.payload ?? {},
        source: event.source ?? "frontend",
      }),
    });
    if (!res.ok) {
      throw new Error(`ApiScenarioProvider: pushEvent failed with ${res.status}`);
    }
  }
}
