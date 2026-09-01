"""
Incident Commander Copilot (V0.4 prompt §10-11, P1 query types A-H).

Flow: User Question -> Intent Parser -> Deterministic Tools -> Structured
Evidence -> Optional LLM Explanation. The LLM (mock by default) only
verbalizes a template built from tool output; it never originates facts.
Unsupported questions get an explicit "cannot answer from available data"
response rather than a guess (prompt: "copilot cannot answer unsupported
facts").
"""

from __future__ import annotations

import re

from app.copilot import tools
from app.copilot.llm_provider import LLMProvider, get_default_provider
from app.rules.data_gaps import overall_confidence
from app.schemas.outputs import CopilotQueryResponse, DataGap, EvidenceItem, ReasonCode
from app.schemas.scenario import ScenarioSnapshot

INTENTS = {
    "PRIORITY": [r"evacuat", r"first", r"priorit"],
    "ROUTE": [r"route", r"road", r"blocked", r"unsafe"],
    "RESOURCE": [r"sdrf", r"rescue team", r"send", r"resource"],
    "CAPACITY": [r"shelter", r"overflow", r"capacity"],
    "IMPACT": [r"what happens if", r"if .* (fails|becomes|goes down)", r"impact"],
    "DATA_TRUST": [r"stale", r"low.confidence", r"trust", r"data gap"],
    "PLAN_EXPLANATION": [r"why did", r"plan change", r"why .* change"],
    "SUMMARY": [r"brief", r"situation", r"summary", r"30.second"],
}


def parse_intent(question: str) -> str:
    q = question.lower()
    for intent, patterns in INTENTS.items():
        for pattern in patterns:
            if re.search(pattern, q):
                return intent
    return "UNSUPPORTED"


async def answer_query(
    snapshot: ScenarioSnapshot, question: str, provider: LLMProvider | None = None
) -> CopilotQueryResponse:
    provider = provider or get_default_provider()
    intent = parse_intent(question)
    conf = overall_confidence(snapshot)
    gaps: list[DataGap] = list(tools.get_data_freshness(snapshot))
    evidence: list[EvidenceItem] = []
    reason_codes: list[ReasonCode] = []
    template: str | None = None

    if intent == "PRIORITY":
        top = tools.get_highest_risk_settlement(snapshot)
        if top is None:
            template = "No settlement data is available in the current scenario snapshot."
        else:
            evidence.append(EvidenceItem(key="risk_score", value=top.risk_score))
            evidence.append(EvidenceItem(key="population", value=top.population))
            reason_codes = [ReasonCode.HIGH_HAZARD_EXPOSURE]
            template = (
                f"{top.name} should be evacuated first: risk score {top.risk_score}, "
                f"{top.population} residents exposed ({top.vulnerable_population} vulnerable)."
            )

    elif intent == "ROUTE":
        status = tools.get_route_status(snapshot)
        blocked = status["blocked"]
        for e in blocked:
            evidence.append(EvidenceItem(key=e.id, value="blocked", note=e.label))
        if blocked:
            template = "Currently blocked/unsafe routes: " + "; ".join(e.label for e in blocked) + "."
        else:
            template = "No routes are currently reported blocked in this snapshot."

    elif intent == "RESOURCE":
        allocation = tools.get_resource_allocation(snapshot)
        if allocation.assignments:
            lines = [f"{a.resource_name} -> {a.assigned_to_settlement_name} ({a.reason})" for a in allocation.assignments]
            template = "Recommended next deployments: " + "; ".join(lines) + "."
            for a in allocation.assignments:
                evidence.append(EvidenceItem(key=a.resource_id, value=a.assigned_to_settlement_name, note=a.reason))
        else:
            template = "No available rescue resources could be matched to at-risk settlements."
        if allocation.unmet_settlements:
            gaps.append(
                DataGap(
                    subject="resources",
                    description=f"No available team for: {', '.join(allocation.unmet_settlements)}.",
                )
            )

    elif intent == "CAPACITY":
        shelters = tools.get_shelter_capacity(snapshot)
        overflowing = [s for s in shelters if s["available"] <= 0 or s["status"] == "full"]
        for s in shelters:
            evidence.append(EvidenceItem(key=s["id"], value=s["available"], note=f"{s['name']} available capacity"))
        if overflowing:
            template = "Likely to overflow: " + ", ".join(s["name"] for s in overflowing) + "."
        else:
            template = "No shelters are currently at or over capacity based on available data."

    elif intent == "IMPACT":
        template = (
            "To evaluate a specific what-if scenario, call POST /api/v1/simulate/what-if "
            "with the relevant change (e.g. BRIDGE_FAILURE); this query endpoint answers "
            "from the current snapshot only and does not simulate hypothetical changes."
        )
        reason_codes = [ReasonCode.ROUTE_FAILURE_RISK]

    elif intent == "DATA_TRUST":
        if gaps:
            template = "Data trust concerns: " + "; ".join(g.description for g in gaps) + "."
        else:
            template = "No significant data gaps or low-confidence facts detected in the current snapshot."

    elif intent == "PLAN_EXPLANATION":
        template = (
            "To explain a specific plan change, call POST /api/v1/copilot/explain-plan-change "
            "with the previous and new scenario snapshots; this query endpoint only has the "
            "current snapshot and cannot infer what changed without both states."
        )

    elif intent == "SUMMARY":
        recs = tools.get_recommendations(snapshot)
        top_actions = [r.action for r in recs.recommendations[:3]]
        template = "Situation brief: " + (
            "; ".join(top_actions) if top_actions else "no active recommendations at this time."
        )

    else:
        template = (
            "This question is outside what the copilot can answer from structured scenario "
            "data. Supported topics: evacuation priority, route status, resource allocation, "
            "shelter capacity, what-if impact, data trust, plan-change explanation, and "
            "situation summaries."
        )

    context = {"answer_template": template}
    answer = await provider.generate(system_prompt="Verbalize only the given structured template.", structured_context=context, question=question)

    return CopilotQueryResponse(
        answer=answer,
        evidence=evidence,
        confidence=conf if intent != "UNSUPPORTED" else 0.0,
        data_gaps=gaps,
        reason_codes=reason_codes,
        intent=intent,
    )
