// Provider selection (V0.3 spec item 11 — "the app can keep working even
// when backend is offline"). Nothing in the existing pages imports this
// yet; it's available for whoever wires a page to use it.

export type { ScenarioAssets, ScenarioDataProvider, ScenarioEvent } from "./types";
export { MockScenarioProvider } from "./mockProvider";
export { ApiScenarioProvider, type ApiScenarioProviderOptions } from "./apiProvider";

import { ApiScenarioProvider } from "./apiProvider";
import { MockScenarioProvider } from "./mockProvider";
import type { ScenarioDataProvider } from "./types";

/**
 * Returns ApiScenarioProvider when NEXT_PUBLIC_API_BASE_URL is set,
 * otherwise falls back to MockScenarioProvider. Callers can always
 * construct either provider directly instead of using this default.
 */
export function getDefaultScenarioProvider(): ScenarioDataProvider {
  const apiBaseUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
  return apiBaseUrl ? new ApiScenarioProvider({ baseUrl: apiBaseUrl }) : new MockScenarioProvider();
}
