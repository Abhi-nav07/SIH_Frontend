import { RouteEdge, Severity, Village } from "./types";

// Weighted, auditable scoring per MASTER_SPEC §5. Every weight is named so
// the DecisionPanel can render a transparent "why" explanation.
export const RISK_WEIGHTS = {
  hazardSeverity: 0.3,
  populationExposure: 0.22,
  vulnerablePopulation: 0.18,
  routeFailureRisk: 0.15,
  shelterPressure: 0.1,
  responseDelay: 0.05,
} as const;

function normalizePopulation(pop: number, max = 1500) {
  return Math.min(1, pop / max);
}

export function routeFailureRisk(village: Village, edges: RouteEdge[]): number {
  const villageEdges = edges.filter((e) => e.from === village.id);
  if (villageEdges.length === 0) return 0.5;
  const blocked = villageEdges.filter((e) => e.status === "blocked").length;
  return blocked / villageEdges.length;
}

export function computeRiskScore(
  village: Village,
  edges: RouteEdge[],
  shelterPressure = 0.2,
  responseDelay = 0.2
): number {
  const populationExposure = normalizePopulation(village.population);
  const vulnerablePopulation = normalizePopulation(village.vulnerablePopulation, 300);
  const routeFail = routeFailureRisk(village, edges);

  const score =
    RISK_WEIGHTS.hazardSeverity * village.hazardSeverity +
    RISK_WEIGHTS.populationExposure * populationExposure +
    RISK_WEIGHTS.vulnerablePopulation * vulnerablePopulation +
    RISK_WEIGHTS.routeFailureRisk * routeFail +
    RISK_WEIGHTS.shelterPressure * shelterPressure +
    RISK_WEIGHTS.responseDelay * responseDelay;

  return Math.round(score * 100) / 100;
}

export function severityFromScore(score: number): Severity {
  if (score >= 0.55) return "critical";
  if (score >= 0.32) return "watch";
  return "safe";
}

export function scoreAllVillages(villages: Village[], edges: RouteEdge[]): Village[] {
  return villages.map((v) => {
    const riskScore = computeRiskScore(v, edges);
    return { ...v, riskScore, status: severityFromScore(riskScore) };
  });
}
