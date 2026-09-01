"""30-second command brief (V0.4 prompt "HIGH-VALUE FEATURE"). Fully
deterministic and templated -- works with zero LLM/API key."""

from __future__ import annotations

from datetime import datetime, timezone

from app.rules.data_gaps import detect_data_gaps
from app.rules.decision_engine import generate_recommendations
from app.rules.risk import score_all_settlements
from app.schemas.outputs import CommandBriefResponse
from app.schemas.scenario import EdgeStatus, ScenarioSnapshot, Severity


def generate_brief(snapshot: ScenarioSnapshot, now: datetime | None = None) -> CommandBriefResponse:
    now = now or datetime.now(timezone.utc)
    scored = score_all_settlements(snapshot)
    critical = [s for s in scored if s.status == Severity.critical]
    population_at_risk = sum(s.population for s in scored if s.status != Severity.safe)
    blocked_bridges = [b for b in snapshot.bridges if b.status == EdgeStatus.blocked]
    near_capacity = [s for s in snapshot.shelters if s.capacity > 0 and s.occupied / s.capacity >= 0.8]

    situation = [f"{len(critical)} critical settlement(s)", f"{population_at_risk} people at risk"]
    for b in blocked_bridges:
        situation.append(f"{b.name} unavailable")
    for s in near_capacity:
        situation.append(f"{s.name} nearing capacity")

    recs = generate_recommendations(snapshot, now)
    top_actions = [r.action for r in recs.recommendations[:3]]

    gaps = detect_data_gaps(snapshot, now)
    data_concerns = [g.description for g in gaps[:5]]

    deadline = None
    if recs.recommendations:
        top = recs.recommendations[0]
        # windowMinutes is not part of the P0 recommendation schema, but urgency
        # + reason codes give a defensible fallback; keep this explicit/labelled
        # rather than fabricating a precise minute count when not modeled.
        deadline = "Not modeled for this settlement in the current snapshot (no decision-window field supplied)."
        if top.urgency == "P1":
            deadline = f"Immediate action window for {top.target} -- treat as highest priority pending officer confirmation."

    return CommandBriefResponse(
        situation=situation,
        top_actions=top_actions if top_actions else ["No active recommendations."],
        data_concerns=data_concerns if data_concerns else ["No significant data concerns detected."],
        next_decision_deadline=deadline,
        generated_at=now.isoformat(),
    )
