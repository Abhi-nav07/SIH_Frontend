"""
Deterministic, auditable risk scoring. Mirrors the weight scheme in
frontend `lib/scenario/risk.ts` / MASTER_SPEC §5 so that V0.4 stays
conceptually consistent with V0.2, without importing any TS code.

    priority = 0.30*hazard + 0.22*population + 0.18*vulnerable
             + 0.15*route_failure + 0.10*shelter_pressure + 0.05*response_delay
"""

from __future__ import annotations

from app.schemas.scenario import ScenarioSnapshot, Settlement, Severity

RISK_WEIGHTS = {
    "hazard_severity": 0.30,
    "population_exposure": 0.22,
    "vulnerable_population": 0.18,
    "route_failure_risk": 0.15,
    "shelter_pressure": 0.10,
    "response_delay": 0.05,
}

CRITICAL_THRESHOLD = 0.55
WATCH_THRESHOLD = 0.32


def _normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return min(1.0, max(0.0, value / max_value))


def route_failure_risk(settlement: Settlement, snapshot: ScenarioSnapshot) -> float:
    edges = snapshot.edges_from(settlement.id)
    if not edges:
        # No route data at all is itself a risk signal (matches routing.ts: 0.5 default).
        return 0.5
    blocked = sum(1 for e in edges if e.status.value == "blocked")
    return blocked / len(edges)


def shelter_pressure(snapshot: ScenarioSnapshot) -> float:
    if not snapshot.shelters:
        return 0.5
    ratios = []
    for s in snapshot.shelters:
        if s.capacity <= 0:
            continue
        ratios.append(min(1.0, s.occupied / s.capacity))
    if not ratios:
        return 0.5
    return sum(ratios) / len(ratios)


def response_delay(snapshot: ScenarioSnapshot, settlement: Settlement) -> float:
    resources = [r for r in snapshot.resources if r.kind == "rescue_team"]
    if not resources:
        return 0.5
    etas = [r.eta_minutes_by_settlement.get(settlement.id) for r in resources]
    etas = [e for e in etas if e is not None]
    if not etas:
        return 0.3  # unknown ETA -> mild default penalty, not zero (avoid false confidence)
    best_eta = min(etas)
    # 0 min -> 0 risk, 60+ min -> full risk
    return _normalize(best_eta, 60)


def compute_risk_score(settlement: Settlement, snapshot: ScenarioSnapshot) -> float:
    population_exposure = _normalize(settlement.population, 1500)
    vulnerable = _normalize(settlement.vulnerable_population, 300)
    route_fail = route_failure_risk(settlement, snapshot)
    pressure = shelter_pressure(snapshot)
    delay = response_delay(snapshot, settlement)

    score = (
        RISK_WEIGHTS["hazard_severity"] * settlement.hazard_severity
        + RISK_WEIGHTS["population_exposure"] * population_exposure
        + RISK_WEIGHTS["vulnerable_population"] * vulnerable
        + RISK_WEIGHTS["route_failure_risk"] * route_fail
        + RISK_WEIGHTS["shelter_pressure"] * pressure
        + RISK_WEIGHTS["response_delay"] * delay
    )
    return round(score, 4)


def severity_from_score(score: float) -> Severity:
    if score >= CRITICAL_THRESHOLD:
        return Severity.critical
    if score >= WATCH_THRESHOLD:
        return Severity.watch
    return Severity.safe


def score_all_settlements(snapshot: ScenarioSnapshot) -> list[Settlement]:
    scored = []
    for s in snapshot.settlements:
        risk = compute_risk_score(s, snapshot)
        updated = s.model_copy(update={"risk_score": risk, "status": severity_from_score(risk)})
        scored.append(updated)
    return scored
