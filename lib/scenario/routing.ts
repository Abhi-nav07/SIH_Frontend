import { RouteEdge, Village } from "./types";

/**
 * Fails all edges dependent on the given bridge (deterministic, transparent —
 * no pathfinding "black box", just explicit dependency flags on each edge).
 */
export function failBridgeEdges(edges: RouteEdge[]): RouteEdge[] {
  return edges.map((e) => (e.isBridgeDependent ? { ...e, status: "blocked" } : e));
}

export function restoreBridgeEdges(edges: RouteEdge[]): RouteEdge[] {
  return edges.map((e) => (e.isBridgeDependent ? { ...e, status: "open" } : e));
}

/** Best open evacuation edge from a village, preferring declared route priority. */
export function bestOpenEdgeForVillage(village: Village, edges: RouteEdge[]): RouteEdge | null {
  const candidates = edges.filter(
    (e) => e.from === village.id && e.status === "open" && e.to.startsWith("shelter-")
  );
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => a.priority - b.priority || a.path.length - b.path.length)[0];
}

export function shelterIdForEdge(edge: RouteEdge): string | null {
  return edge.to.startsWith("shelter-") ? edge.to : null;
}

export function routesValidCount(edges: RouteEdge[]) {
  const open = edges.filter((e) => e.status === "open").length;
  return { open, total: edges.length };
}
