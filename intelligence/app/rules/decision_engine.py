"""
Deterministic decision engine (V0.4 prompt §3-4).

Produces PriorityRecommendation objects with an evidence graph and reason
codes, explainable without any LLM involvement. This is the P0 core the
what-if simulator, resource allocator, and copilot all build on top of.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.rules.data_gaps import detect_data_gaps, overall_confidence
from app.rules.risk import CRITICAL_THRESHOLD, WATCH_THRESHOLD, route_failure_risk, score_all_settlements
from app.schemas.outputs import (
    DataGap,
    EvidenceItem,
    PriorityRecommendation,
    ReasonCode,
    RecommendationResponse,
)
from app.schemas.scenario import ScenarioSnapshot, Settlement, Severity


def _reason_codes_for(settlement: Settlement, snapshot: ScenarioSnapshot) -> list[ReasonCode]:
    codes: list[ReasonCode] = []
    if settlement.hazard_severity >= 0.6:
        codes.append(ReasonCode.HIGH_HAZARD_EXPOSURE)
    if settlement.vulnerable_population >= 100:
        codes.append(ReasonCode.VULNERABLE_POPULATION)
    if route_failure_risk(settlement, snapshot) > 0.0:
        codes.append(ReasonCode.ROUTE_FAILURE_RISK)
    if not snapshot.edges_from(settlement.id):
        codes.append(ReasonCode.ISOLATION_RISK)

    # Shelter capacity deficit relative to this settlement's population.
    total_available = sum(s.available for s in snapshot.shelters)
    if snapshot.shelters and total_available < settlement.population:
        codes.append(ReasonCode.SHELTER_CAPACITY_DEFICIT)

    if any(not h.accessible for h in snapshot.hospitals):
        codes.append(ReasonCode.HOSPITAL_ACCESS_RISK)

    if snapshot.resources and not any(r.available for r in snapshot.resources if r.kind == "rescue_team"):
        codes.append(ReasonCode.RESOURCE_SHORTAGE)

    stale_or_low_conf = any(
        e.provenance.confidence < 0.5 for e in snapshot.edges_from(settlement.id)
    )
    if stale_or_low_conf:
        codes.append(ReasonCode.STALE_INFRASTRUCTURE_DATA)

    return codes or [ReasonCode.HIGH_HAZARD_EXPOSURE]


def _evidence_for(settlement: Settlement, snapshot: ScenarioSnapshot) -> list[EvidenceItem]:
    available_shelter_capacity = sum(s.available for s in snapshot.shelters)
    rescue_etas = [
        r.eta_minutes_by_settlement.get(settlement.id)
        for r in snapshot.resources
        if r.kind == "rescue_team" and r.eta_minutes_by_settlement.get(settlement.id) is not None
    ]
    nearest_eta = min(rescue_etas) if rescue_etas else None

    items = [
        EvidenceItem(key="flood_risk_score", value=settlement.risk_score, note="0-1 scale, weighted per MASTER_SPEC §5"),
        EvidenceItem(key="population", value=settlement.population),
        EvidenceItem(key="vulnerable_population", value=settlement.vulnerable_population),
        EvidenceItem(
            key="route_failure_risk",
            value=route_failure_risk(settlement, snapshot),
            note="fraction of outbound routes currently blocked",
        ),
        EvidenceItem(key="shelter_capacity_available", value=available_shelter_capacity),
    ]
    if nearest_eta is not None:
        items.append(EvidenceItem(key="nearest_rescue_eta_minutes", value=nearest_eta, unit="min"))
    else:
        items.append(EvidenceItem(key="nearest_rescue_eta_minutes", value=None, note="no ETA data available"))
    return items


def _urgency(status: Severity) -> str:
    return {"critical": "P1", "watch": "P2", "safe": "P3"}[status.value]


def generate_recommendations(snapshot: ScenarioSnapshot, now: datetime | None = None) -> RecommendationResponse:
    now = now or datetime.now(timezone.utc)
    scored = score_all_settlements(snapshot)
    scored_snapshot = snapshot.model_copy(update={"settlements": scored})

    at_risk = [s for s in scored if s.status != Severity.safe]
    at_risk.sort(key=lambda s: s.risk_score or 0.0, reverse=True)

    conf = overall_confidence(scored_snapshot)
    gaps = detect_data_gaps(scored_snapshot, now)
    gap_subjects = {g.subject for g in gaps}

    recs: list[PriorityRecommendation] = []
    for rank, settlement in enumerate(at_risk, start=1):
        urgent = settlement.status == Severity.critical
        action = f"Evacuate {settlement.name}" if urgent else f"Prepare {settlement.name} for possible evacuation"
        codes = _reason_codes_for(settlement, scored_snapshot)
        evidence = _evidence_for(settlement, scored_snapshot)

        assumptions = []
        if not snapshot.edges_from(settlement.id):
            assumptions.append("No route data supplied for this settlement; isolation risk assumed elevated.")
        settlement_conf = settlement.provenance.confidence
        rec_conf = round(min(conf, settlement_conf), 2)

        recs.append(
            PriorityRecommendation(
                rank=rank,
                action=action,
                target=settlement.name,
                department="SDRF" if urgent else "DDMA",
                urgency=_urgency(settlement.status),
                reason_codes=codes,
                score=settlement.risk_score or 0.0,
                evidence=evidence,
                assumptions=assumptions,
                confidence=rec_conf,
                is_simulated=settlement.provenance.is_simulated,
            )
        )

    return RecommendationResponse(
        scenario_id=snapshot.scenario_id,
        generated_at=now.isoformat(),
        recommendations=recs,
        data_gaps=gaps,
    )
