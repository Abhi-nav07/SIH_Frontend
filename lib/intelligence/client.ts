import { CompareResponse, CopilotResponse, ScenarioSnapshot, WhatIfChange } from "./types";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`/api/intelligence/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Intelligence service returned ${response.status}`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function queryCopilot(snapshot: ScenarioSnapshot, question: string) {
  const response = await postJson<CopilotResponse>("copilot/query", { scenario_snapshot: snapshot, question });
  return { ...response, source: "service" as const };
}

export async function compareWhatIf(snapshot: ScenarioSnapshot, changes: WhatIfChange[]) {
  const response = await postJson<CompareResponse>("simulate/compare", { scenario_snapshot: snapshot, scenario_id: snapshot.scenario_id, changes });
  return { ...response, source: "service" as const };
}
