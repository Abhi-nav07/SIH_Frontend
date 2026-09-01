"""
Resource allocation engine (V0.4 prompt §8-9). Transparent heuristics, not a
full optimization solver -- sufficient for an auditable demo.
"""

from __future__ import annotations

from app.rules.data_gaps import detect_data_gaps
from app.rules.risk import score_all_settlements
from app.schemas.outputs import (
    DataGap,
    ResourceAllocationResponse,
    ResourceAssignment,
    ShelterAllocationLine,
    ShelterAllocationResponse,
)
from app.schemas.scenario import ScenarioSnapshot, Severity


def allocate_resources(snapshot: ScenarioSnapshot) -> ResourceAllocationResponse:
    scored = score_all_settlements(snapshot)
    at_risk = sorted(
        [s for s in scored if s.status != Severity.safe],
        key=lambda s: s.risk_score or 0.0,
        reverse=True,
    )

    rescue_teams = [r for r in snapshot.resources if r.kind == "rescue_team" and r.available]
    assignments: list[ResourceAssignment] = []
    used_team_ids: set[str] = set()
    unmet: list[str] = []

    for settlement in at_risk:
        # Prefer the team with the best (lowest) ETA to this settlement, among
        # teams not already assigned. Falls back to "unassigned ETA" teams
        # rather than inventing a number.
        candidates = [t for t in rescue_teams if t.id not in used_team_ids]
        if not candidates:
            unmet.append(settlement.id)
            continue

        def sort_key(team):
            eta = team.eta_minutes_by_settlement.get(settlement.id)
            return (eta is None, eta if eta is not None else float("inf"))

        candidates.sort(key=sort_key)
        chosen = candidates[0]
        used_team_ids.add(chosen.id)

        reasons = []
        if settlement.status == Severity.critical:
            reasons.append("highest risk settlement")
        eta = chosen.eta_minutes_by_settlement.get(settlement.id)
        if eta is not None:
            reasons.append(f"ETA {eta:.0f} min")
        else:
            reasons.append("no ETA data -- assumed nearest available by rank order")
        edges = snapshot.edges_from(settlement.id)
        if edges and any(e.status.value == "open" for e in edges):
            reasons.append("road still accessible")
        elif edges:
            reasons.append("isolation risk elevated -- all known routes blocked")

        assignments.append(
            ResourceAssignment(
                resource_id=chosen.id,
                resource_name=chosen.name,
                assigned_to_settlement_id=settlement.id,
                assigned_to_settlement_name=settlement.name,
                reason=" + ".join(reasons),
                confidence=0.6 if eta is None else 0.85,
            )
        )

    gaps: list[DataGap] = detect_data_gaps(snapshot)
    if not rescue_teams:
        gaps.append(DataGap(subject="resources", description="No available rescue teams in scenario snapshot."))

    return ResourceAllocationResponse(
        scenario_id=snapshot.scenario_id,
        assignments=assignments,
        unmet_settlements=unmet,
        data_gaps=gaps,
    )


def allocate_shelter_for_settlement(
    snapshot: ScenarioSnapshot, settlement_id: str, evacuee_count: int | None = None
) -> ShelterAllocationResponse:
    settlement = snapshot.settlement(settlement_id)
    demand = evacuee_count if evacuee_count is not None else (settlement.population if settlement else 0)

    remaining = demand
    lines: list[ShelterAllocationLine] = []
    # Deterministic order: shelters with the most available capacity first,
    # excluding full/closed shelters.
    candidates = sorted(
        [s for s in snapshot.shelters if s.status.value != "full" and s.available > 0],
        key=lambda s: s.available,
        reverse=True,
    )

    for shelter in candidates:
        if remaining <= 0:
            break
        take = min(shelter.available, remaining)
        if take <= 0:
            continue
        lines.append(
            ShelterAllocationLine(
                shelter_id=shelter.id,
                shelter_name=shelter.name,
                allocated=take,
                available_before=shelter.available,
                available_after=shelter.available - take,
            )
        )
        remaining -= take

    unmet_capacity = max(0, remaining)

    return ShelterAllocationResponse(
        scenario_id=snapshot.scenario_id,
        settlement_id=settlement_id,
        demand=demand,
        allocations=lines,
        unmet_capacity=unmet_capacity,
        overload_warning=unmet_capacity > 0,
    )
