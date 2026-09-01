"""Plan-change explainer (V0.4 prompt "HIGH-VALUE FEATURE"). Deterministic
diff between two ScenarioSnapshots -> plain-language trigger + consequences
+ new recommendation, all evidence-backed."""

from __future__ import annotations

from app.rules.decision_engine import generate_recommendations
from app.schemas.outputs import EvidenceItem, PlanChangeExplainResponse
from app.schemas.scenario import EdgeStatus, ScenarioSnapshot


def explain_plan_change(previous: ScenarioSnapshot, new: ScenarioSnapshot) -> PlanChangeExplainResponse:
    triggers: list[str] = []
    consequences: list[str] = []
    evidence: list[EvidenceItem] = []

    prev_bridges = {b.id: b for b in previous.bridges}
    for b in new.bridges:
        prev = prev_bridges.get(b.id)
        if prev and prev.status != b.status and b.status == EdgeStatus.blocked:
            triggers.append(f"{b.name} became unavailable.")
            evidence.append(EvidenceItem(key=b.id, value=b.status.value, note=f"previously {prev.status.value}"))

    prev_edges = {e.id: e for e in previous.roads}
    for e in new.roads:
        prev = prev_edges.get(e.id)
        if prev and prev.status != e.status and e.status == EdgeStatus.blocked:
            consequences.append(f"Route '{e.label}' invalidated.")

    prev_shelters = {s.id: s for s in previous.shelters}
    for s in new.shelters:
        prev = prev_shelters.get(s.id)
        if prev and prev.status != s.status:
            if s.status.value == "full":
                consequences.append(f"{s.name} became unreachable/unavailable.")
            elif prev.occupied != s.occupied and s.occupied > prev.occupied:
                consequences.append(f"{s.name} demand increased.")

    prev_settlement_ids = {s.id for s in previous.settlements}
    for s in new.settlements:
        if s.id in prev_settlement_ids:
            prev_s = next(p for p in previous.settlements if p.id == s.id)
            if prev_s.assigned_shelter_id != s.assigned_shelter_id and s.assigned_shelter_id:
                new_shelter = new.shelter(s.assigned_shelter_id)
                consequences.append(
                    f"{s.name} reassigned to {new_shelter.name if new_shelter else s.assigned_shelter_id}."
                )

    new_recs = generate_recommendations(new)
    new_recommendation = None
    if new_recs.recommendations:
        top = new_recs.recommendations[0]
        new_recommendation = f"{top.action} (urgency {top.urgency}, score {top.score})."

    if not triggers:
        triggers.append("No infrastructure-status trigger detected between the two snapshots (facts may have changed elsewhere).")

    return PlanChangeExplainResponse(
        trigger=triggers,
        operational_consequences=consequences if consequences else ["No downstream operational consequences detected."],
        new_recommendation=new_recommendation,
        evidence=evidence,
    )
