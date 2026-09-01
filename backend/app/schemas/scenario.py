from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.assets import (
    BridgeOut,
    HospitalOut,
    ResponseResourceOut,
    RoadSegmentOut,
    SettlementOut,
    ShelterOut,
)
from app.schemas.events import DisasterEventOut


class ScenarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    district: str
    phase: str
    clock_seconds: int
    is_simulated: bool
    created_at: datetime
    updated_at: datetime


class ScenarioCreate(BaseModel):
    id: str
    name: str
    district: str = "Uttarakhand"


class ScenarioState(BaseModel):
    """Full normalized operational state for one scenario.

    This is the payload MockScenarioProvider/ApiScenarioProvider on the
    frontend both resolve to — see /shared/types.ts for the mirrored
    TypeScript shape.
    """

    scenario: ScenarioOut
    active_alerts: list[DisasterEventOut]
    settlements: list[SettlementOut]
    roads: list[RoadSegmentOut]
    bridges: list[BridgeOut]
    shelters: list[ShelterOut]
    hospitals: list[HospitalOut]
    resources: list[ResponseResourceOut]
    generated_at: datetime


class ScenarioEventIn(BaseModel):
    """POST /scenarios/{id}/events payload — a field/infrastructure change
    the scenario should react to (e.g. bridge failure), distinct from a
    DisasterEvent alert."""

    kind: str  # e.g. "BRIDGE_STATUS_CHANGED", "ROAD_BLOCKED"
    asset_id: str | None = None
    payload: dict = {}
    source: str = "simulated"


class ScenarioSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scenario_id: str
    reason: str
    created_at: datetime


class ScenarioSnapshotDetailOut(ScenarioSnapshotOut):
    state: ScenarioState
