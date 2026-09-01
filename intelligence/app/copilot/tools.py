"""
Deterministic tool functions (V0.4 prompt §11). The copilot's intent parser
calls these instead of letting an LLM free-associate an answer.
"""

from __future__ import annotations

from app.rules.data_gaps import detect_data_gaps
from app.rules.decision_engine import generate_recommendations
from app.rules.risk import score_all_settlements
from app.schemas.scenario import EdgeStatus, ScenarioSnapshot, Severity
from app.services.allocation import allocate_resources, allocate_shelter_for_settlement


def get_highest_risk_settlement(snapshot: ScenarioSnapshot):
    scored = score_all_settlements(snapshot)
    if not scored:
        return None
    return max(scored, key=lambda s: s.risk_score or 0.0)


def get_route_status(snapshot: ScenarioSnapshot):
    blocked = [e for e in snapshot.roads if e.status == EdgeStatus.blocked]
    open_ = [e for e in snapshot.roads if e.status == EdgeStatus.open]
    unknown = [e for e in snapshot.roads if e.status == EdgeStatus.unknown]
    return {"blocked": blocked, "open": open_, "unknown": unknown}


def get_shelter_capacity(snapshot: ScenarioSnapshot):
    return [
        {"id": s.id, "name": s.name, "capacity": s.capacity, "occupied": s.occupied, "available": s.available, "status": s.status.value}
        for s in snapshot.shelters
    ]


def get_resource_availability(snapshot: ScenarioSnapshot):
    return [
        {"id": r.id, "name": r.name, "kind": r.kind, "available": r.available}
        for r in snapshot.resources
    ]


def get_data_freshness(snapshot: ScenarioSnapshot):
    return detect_data_gaps(snapshot)


def compare_scenario_states(before: ScenarioSnapshot, after: ScenarioSnapshot):
    before_scored = score_all_settlements(before)
    after_scored = score_all_settlements(after)
    before_critical = {s.id for s in before_scored if s.status == Severity.critical}
    after_critical = {s.id for s in after_scored if s.status == Severity.critical}
    return {
        "newly_critical": after_critical - before_critical,
        "no_longer_critical": before_critical - after_critical,
    }


def get_recommendations(snapshot: ScenarioSnapshot):
    return generate_recommendations(snapshot)


def get_resource_allocation(snapshot: ScenarioSnapshot):
    return allocate_resources(snapshot)


def get_shelter_allocation(snapshot: ScenarioSnapshot, settlement_id: str):
    return allocate_shelter_for_settlement(snapshot, settlement_id)
