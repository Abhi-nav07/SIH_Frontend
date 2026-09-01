from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ReasonCode(str, Enum):
    HIGH_HAZARD_EXPOSURE = "HIGH_HAZARD_EXPOSURE"
    VULNERABLE_POPULATION = "VULNERABLE_POPULATION"
    ROUTE_FAILURE_RISK = "ROUTE_FAILURE_RISK"
    SHELTER_CAPACITY_DEFICIT = "SHELTER_CAPACITY_DEFICIT"
    HOSPITAL_ACCESS_RISK = "HOSPITAL_ACCESS_RISK"
    RESOURCE_SHORTAGE = "RESOURCE_SHORTAGE"
    ISOLATION_RISK = "ISOLATION_RISK"
    STALE_INFRASTRUCTURE_DATA = "STALE_INFRASTRUCTURE_DATA"
    CONFLICTING_FIELD_REPORTS = "CONFLICTING_FIELD_REPORTS"


class EvidenceItem(BaseModel):
    key: str
    value: Any
    unit: Optional[str] = None
    note: Optional[str] = None


class PriorityRecommendation(BaseModel):
    rank: int
    action: str
    target: str  # settlement id / name
    department: Optional[str] = None
    urgency: str  # "P1" | "P2" | "P3"
    reason_codes: list[ReasonCode]
    score: float
    evidence: list[EvidenceItem]
    assumptions: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    status: str = Field(default="REQUIRES OFFICER CONFIRMATION", description="Guardrail: never auto-executed.")
    is_simulated: bool = True


class DataGap(BaseModel):
    subject: str
    description: str


class RecommendationResponse(BaseModel):
    scenario_id: str
    generated_at: str
    recommendations: list[PriorityRecommendation]
    data_gaps: list[DataGap]
    disclaimer: str = (
        "Deterministic, auditable prototype logic per MASTER_SPEC §5. Not a validated emergency risk model."
    )


class WhatIfChangeType(str, Enum):
    RAIN_INTENSITY_CHANGE = "RAIN_INTENSITY_CHANGE"
    BRIDGE_FAILURE = "BRIDGE_FAILURE"
    ROAD_BLOCKAGE = "ROAD_BLOCKAGE"
    SHELTER_CLOSURE = "SHELTER_CLOSURE"
    HOSPITAL_CAPACITY_DROP = "HOSPITAL_CAPACITY_DROP"
    RESOURCE_UNAVAILABLE = "RESOURCE_UNAVAILABLE"
    WIND_SHIFT = "WIND_SHIFT"
    POPULATION_INCREASE = "POPULATION_INCREASE"


class WhatIfChange(BaseModel):
    type: WhatIfChangeType
    target_id: Optional[str] = None
    value_percent: Optional[float] = None


class WhatIfRequest(BaseModel):
    scenario_id: str
    changes: list[WhatIfChange]


class ImpactStep(BaseModel):
    order: int
    description: str


class WhatIfResponse(BaseModel):
    scenario_id: str
    applied_changes: list[WhatIfChange]
    impact_chain: list[ImpactStep]
    recommendations: RecommendationResponse
    is_simulated: bool = True


class CompareRequest(BaseModel):
    before_scenario_id: Optional[str] = None
    scenario_id: str
    changes: list[WhatIfChange]


class StateSummary(BaseModel):
    critical_settlements: int
    population_at_risk: int
    usable_shelters: int
    primary_routes_blocked: int
    rescue_shortfall: int


class CompareResponse(BaseModel):
    before: StateSummary
    after: StateSummary
    delta: dict[str, int]
    narrative: list[str]
    is_simulated: bool = True


class ResourceAllocationRequest(BaseModel):
    scenario_id: str


class ResourceAssignment(BaseModel):
    resource_id: str
    resource_name: str
    assigned_to_settlement_id: str
    assigned_to_settlement_name: str
    reason: str
    confidence: float
    status: str = "REQUIRES OFFICER CONFIRMATION"


class ResourceAllocationResponse(BaseModel):
    scenario_id: str
    assignments: list[ResourceAssignment]
    unmet_settlements: list[str]
    data_gaps: list[DataGap]


class ShelterAllocationRequest(BaseModel):
    scenario_id: str
    settlement_id: str
    evacuee_count: Optional[int] = None


class ShelterAllocationLine(BaseModel):
    shelter_id: str
    shelter_name: str
    allocated: int
    available_before: int
    available_after: int


class ShelterAllocationResponse(BaseModel):
    scenario_id: str
    settlement_id: str
    demand: int
    allocations: list[ShelterAllocationLine]
    unmet_capacity: int
    overload_warning: bool
    status: str = "REQUIRES OFFICER CONFIRMATION"


class CopilotQueryRequest(BaseModel):
    scenario_snapshot: Optional[dict[str, Any]] = None
    scenario_id: Optional[str] = None
    question: str


class CopilotQueryResponse(BaseModel):
    answer: str
    evidence: list[EvidenceItem]
    confidence: float
    data_gaps: list[DataGap]
    reason_codes: list[ReasonCode] = Field(default_factory=list)
    intent: str
    status: str = "REQUIRES OFFICER CONFIRMATION"


class CommandBriefRequest(BaseModel):
    scenario_id: Optional[str] = None
    scenario_snapshot: Optional[dict[str, Any]] = None


class CommandBriefResponse(BaseModel):
    situation: list[str]
    top_actions: list[str]
    data_concerns: list[str]
    next_decision_deadline: Optional[str]
    generated_at: str
    is_simulated: bool = True


class PlanChangeExplainRequest(BaseModel):
    previous_scenario_snapshot: dict[str, Any]
    new_scenario_snapshot: dict[str, Any]


class PlanChangeExplainResponse(BaseModel):
    trigger: list[str]
    operational_consequences: list[str]
    new_recommendation: Optional[str]
    evidence: list[EvidenceItem]
    is_simulated: bool = True
