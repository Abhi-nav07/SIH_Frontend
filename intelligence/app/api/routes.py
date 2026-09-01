from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.copilot.brief import generate_brief
from app.copilot.engine import answer_query
from app.explainability.plan_change import explain_plan_change
from app.rules.decision_engine import generate_recommendations
from app.schemas.outputs import (
    CommandBriefRequest,
    CommandBriefResponse,
    CompareRequest,
    CompareResponse,
    CopilotQueryRequest,
    CopilotQueryResponse,
    PlanChangeExplainRequest,
    PlanChangeExplainResponse,
    RecommendationResponse,
    ResourceAllocationRequest,
    ResourceAllocationResponse,
    ShelterAllocationRequest,
    ShelterAllocationResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.schemas.scenario import ScenarioSnapshot
from app.services.allocation import allocate_resources, allocate_shelter_for_settlement
from app.simulator.whatif import compare_scenarios, run_what_if

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/api/v1/decision/recommendations", response_model=RecommendationResponse)
def post_recommendations(snapshot: ScenarioSnapshot):
    return generate_recommendations(snapshot)


@router.post("/api/v1/simulate/what-if", response_model=WhatIfResponse)
def post_what_if(payload: dict):
    try:
        snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
        request = WhatIfRequest(scenario_id=payload["scenario_id"], changes=payload["changes"])
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing field: {e}")
    return run_what_if(snapshot, request.changes)


@router.post("/api/v1/simulate/compare", response_model=CompareResponse)
def post_compare(payload: dict):
    try:
        snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
        request = CompareRequest(scenario_id=payload["scenario_id"], changes=payload["changes"])
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing field: {e}")
    return compare_scenarios(snapshot, request.changes)


@router.post("/api/v1/resources/allocate", response_model=ResourceAllocationResponse)
def post_resource_allocate(payload: dict):
    snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
    return allocate_resources(snapshot)


@router.post("/api/v1/shelters/allocate", response_model=ShelterAllocationResponse)
def post_shelter_allocate(payload: dict):
    snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
    request = ShelterAllocationRequest(
        scenario_id=payload["scenario_id"],
        settlement_id=payload["settlement_id"],
        evacuee_count=payload.get("evacuee_count"),
    )
    return allocate_shelter_for_settlement(snapshot, request.settlement_id, request.evacuee_count)


@router.post("/api/v1/copilot/query", response_model=CopilotQueryResponse)
async def post_copilot_query(payload: dict):
    snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
    request = CopilotQueryRequest(scenario_snapshot=payload["scenario_snapshot"], question=payload["question"])
    return await answer_query(snapshot, request.question)


@router.post("/api/v1/copilot/brief", response_model=CommandBriefResponse)
def post_copilot_brief(payload: dict):
    snapshot = ScenarioSnapshot.model_validate(payload["scenario_snapshot"])
    return generate_brief(snapshot)


@router.post("/api/v1/copilot/explain-plan-change", response_model=PlanChangeExplainResponse)
def post_explain_plan_change(payload: dict):
    request = PlanChangeExplainRequest(
        previous_scenario_snapshot=payload["previous_scenario_snapshot"],
        new_scenario_snapshot=payload["new_scenario_snapshot"],
    )
    previous = ScenarioSnapshot.model_validate(request.previous_scenario_snapshot)
    new = ScenarioSnapshot.model_validate(request.new_scenario_snapshot)
    return explain_plan_change(previous, new)
