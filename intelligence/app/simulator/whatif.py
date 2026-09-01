"""
What-if simulation engine (V0.4 prompt §5-7).

Applies a list of controlled perturbations to a ScenarioSnapshot, propagates
their consequences through explicit dependency rules (not a black-box
predictive model), and returns the resulting snapshot plus a human-readable
impact chain. Also supports before/after counterfactual comparison.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.rules.decision_engine import generate_recommendations
from app.rules.risk import score_all_settlements
from app.schemas.outputs import (
    CompareResponse,
    ImpactStep,
    StateSummary,
    WhatIfChange,
    WhatIfChangeType,
    WhatIfResponse,
)
from app.schemas.scenario import EdgeStatus, ScenarioSnapshot, Severity


def apply_change(snapshot: ScenarioSnapshot, change: WhatIfChange) -> tuple[ScenarioSnapshot, list[str]]:
    steps: list[str] = []
    data = snapshot.model_dump(by_alias=True)

    if change.type == WhatIfChangeType.BRIDGE_FAILURE:
        bridge_id = change.target_id
        for b in data["bridges"]:
            if b["id"] == bridge_id:
                b["status"] = "blocked"
        blocked_edges = []
        for e in data["roads"]:
            if e.get("is_bridge_dependent") and (bridge_id is None or e.get("bridge_id") == bridge_id or bridge_id in (e["id"],)):
                # Fall back: if bridge_id not explicitly tagged on edge, block all
                # bridge-dependent edges (matches routing.ts failBridgeEdges semantics
                # for the single-bridge V1 scenario).
                e["status"] = "blocked"
                blocked_edges.append(e["label"])
        steps.append(f"Bridge '{bridge_id}' fails -> road graph updated, impassable.")
        if blocked_edges:
            steps.append(f"Routes invalidated: {', '.join(blocked_edges)}.")

    elif change.type == WhatIfChangeType.ROAD_BLOCKAGE:
        for e in data["roads"]:
            if e["id"] == change.target_id:
                e["status"] = "blocked"
                steps.append(f"Road '{e['label']}' blocked directly.")

    elif change.type == WhatIfChangeType.SHELTER_CLOSURE:
        for s in data["shelters"]:
            if s["id"] == change.target_id:
                s["status"] = "full"
                s["occupied"] = s["capacity"]
                steps.append(f"Shelter '{s['name']}' closed -> capacity unavailable.")

    elif change.type == WhatIfChangeType.HOSPITAL_CAPACITY_DROP:
        for h in data["hospitals"]:
            if h["id"] == change.target_id:
                h["accessible"] = False
                steps.append(f"Hospital '{h['name']}' access degraded.")

    elif change.type == WhatIfChangeType.RESOURCE_UNAVAILABLE:
        for r in data["resources"]:
            if r["id"] == change.target_id:
                r["available"] = False
                steps.append(f"Resource '{r['name']}' marked unavailable.")

    elif change.type == WhatIfChangeType.RAIN_INTENSITY_CHANGE:
        pct = (change.value_percent or 0.0) / 100.0
        for s in data["settlements"]:
            s["hazard_severity"] = max(0.0, min(1.0, s["hazard_severity"] * (1 + pct)))
        steps.append(f"Rainfall intensity changes by {change.value_percent}% -> hazard severity rescaled for all settlements.")

    elif change.type == WhatIfChangeType.WIND_SHIFT:
        steps.append("Wind shift applied (no direct scoring effect modeled in V0.4; logged for audit).")

    elif change.type == WhatIfChangeType.POPULATION_INCREASE:
        pct = (change.value_percent or 0.0) / 100.0
        for s in data["settlements"]:
            if change.target_id is None or s["id"] == change.target_id:
                s["population"] = int(round(s["population"] * (1 + pct)))
        steps.append(f"Population increases by {change.value_percent}% for {'all settlements' if change.target_id is None else change.target_id}.")

    new_snapshot = ScenarioSnapshot.model_validate(data)
    return new_snapshot, steps


def _propagate_downstream(snapshot: ScenarioSnapshot, changes: list[WhatIfChange]) -> list[str]:
    """Explicit, reusable dependency narration (V0.4 prompt §7) -- not tied to
    one hardcoded story: walks whichever entities were actually affected."""
    narration: list[str] = []
    blocked_edges = [e for e in snapshot.roads if e.status == EdgeStatus.blocked]
    if any(c.type == WhatIfChangeType.BRIDGE_FAILURE for c in changes) and blocked_edges:
        affected_settlements = {e.from_id for e in blocked_edges}
        for sid in affected_settlements:
            settlement = snapshot.settlement(sid)
            if settlement:
                narration.append(f"{settlement.name} travel time increases; primary route no longer viable.")
        for shelter in snapshot.shelters:
            targeted = any(e.to_id == shelter.id for e in blocked_edges)
            if targeted:
                narration.append(f"{shelter.name} becomes harder to reach; demand shifts to remaining shelters.")
        remaining = [s for s in snapshot.shelters if s.status.value != "full"]
        if remaining:
            narration.append(f"Load increases on remaining shelter(s): {', '.join(s.name for s in remaining)}.")
        narration.append("Transport demand increases; PWD/Police/Electricity tasks likely required along alternate routes.")

    if any(c.type == WhatIfChangeType.SHELTER_CLOSURE for c in changes):
        remaining = [s for s in snapshot.shelters if s.status.value != "full"]
        if remaining:
            narration.append(f"Evacuee demand redistributes to: {', '.join(s.name for s in remaining)}.")
        else:
            narration.append("No shelters with available capacity remain -- overload risk across the district.")

    return narration


def run_what_if(snapshot: ScenarioSnapshot, changes: list[WhatIfChange], now: datetime | None = None) -> WhatIfResponse:
    now = now or datetime.now(timezone.utc)
    working = snapshot
    all_steps: list[str] = []
    for change in changes:
        working, steps = apply_change(working, change)
        all_steps.extend(steps)

    downstream = _propagate_downstream(working, changes)
    all_steps.extend(downstream)

    impact_chain = [ImpactStep(order=i + 1, description=s) for i, s in enumerate(all_steps)]
    recs = generate_recommendations(working, now)

    return WhatIfResponse(
        scenario_id=snapshot.scenario_id,
        applied_changes=changes,
        impact_chain=impact_chain,
        recommendations=recs,
    )


def _summarize_state(snapshot: ScenarioSnapshot) -> StateSummary:
    scored = score_all_settlements(snapshot)
    critical = [s for s in scored if s.status == Severity.critical]
    population_at_risk = sum(s.population for s in scored if s.status != Severity.safe)
    usable_shelters = sum(1 for s in snapshot.shelters if s.status.value != "full" and s.available > 0)
    blocked_primary = sum(1 for e in snapshot.roads if e.is_bridge_dependent and e.status == EdgeStatus.blocked)

    total_available_capacity = sum(s.available for s in snapshot.shelters)
    rescue_shortfall = 0
    if population_at_risk > total_available_capacity:
        deficit = population_at_risk - total_available_capacity
        rescue_shortfall = max(0, -(-deficit // 1000))  # ceil-div: ~1 team per 1000 unhoused, illustrative heuristic

    return StateSummary(
        critical_settlements=len(critical),
        population_at_risk=population_at_risk,
        usable_shelters=usable_shelters,
        primary_routes_blocked=blocked_primary,
        rescue_shortfall=rescue_shortfall,
    )


def compare_scenarios(before: ScenarioSnapshot, changes: list[WhatIfChange]) -> CompareResponse:
    after_snapshot = before
    for change in changes:
        after_snapshot, _ = apply_change(after_snapshot, change)

    before_summary = _summarize_state(before)
    after_summary = _summarize_state(after_snapshot)

    delta = {
        "critical_settlements": after_summary.critical_settlements - before_summary.critical_settlements,
        "population_at_risk": after_summary.population_at_risk - before_summary.population_at_risk,
        "usable_shelters": after_summary.usable_shelters - before_summary.usable_shelters,
        "primary_routes_blocked": after_summary.primary_routes_blocked - before_summary.primary_routes_blocked,
        "rescue_shortfall": after_summary.rescue_shortfall - before_summary.rescue_shortfall,
    }

    narrative = []
    if delta["critical_settlements"] > 0:
        narrative.append(f"+{delta['critical_settlements']} critical settlement(s)")
    elif delta["critical_settlements"] < 0:
        narrative.append(f"{delta['critical_settlements']} critical settlement(s)")
    if delta["population_at_risk"] != 0:
        sign = "+" if delta["population_at_risk"] > 0 else ""
        narrative.append(f"{sign}{delta['population_at_risk']} people at risk")
    if delta["usable_shelters"] < 0:
        narrative.append(f"{abs(delta['usable_shelters'])} fewer usable evacuation shelter(s)")
    if delta["primary_routes_blocked"] > 0:
        narrative.append(f"+{delta['primary_routes_blocked']} primary route(s) unavailable")
    if delta["rescue_shortfall"] > 0:
        narrative.append(f"+{delta['rescue_shortfall']} additional rescue team(s) required")

    return CompareResponse(before=before_summary, after=after_summary, delta=delta, narrative=narrative)
