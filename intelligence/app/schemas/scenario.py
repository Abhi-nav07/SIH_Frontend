"""
ScenarioSnapshot input schema (MASTER_SPEC / V0.4 prompt, section "Define
ScenarioSnapshot input schema").

This is intentionally self-contained: the intelligence service does not
import anything from the Next.js frontend or the (future) V0.3 backend. It
mirrors the shapes in lib/scenario/types.ts closely enough that a future
adapter can translate a V0.3 DB row -> this schema with a thin mapping layer,
but there is zero hard dependency in either direction.

Every field that represents a real-world fact carries provenance:
source, observed_at, confidence, is_simulated. The decision engine and
copilot are only allowed to reason over what is present here - if a fact is
missing, that is a DATA GAP, not something to invent.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Severity(str, Enum):
    safe = "safe"
    watch = "watch"
    critical = "critical"


class EdgeStatus(str, Enum):
    open = "open"
    blocked = "blocked"
    unknown = "unknown"


class ShelterStatus(str, Enum):
    ready = "ready"
    standby = "standby"
    full = "full"


class Department(str, Enum):
    ddma = "DDMA"
    police = "Police"
    sdrf = "SDRF"
    health = "Health"
    pwd = "PWD"
    transport = "Transport"
    electricity = "Electricity"


class TaskStatus(str, Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    completed = "completed"
    escalated = "escalated"


class Provenance(BaseModel):
    """Every critical fact should carry this. See MASTER_SPEC §8."""

    source: str = Field(..., description="Where this fact came from, e.g. 'IMD feed', 'field report', 'simulated seed'.")
    observed_at: Optional[datetime] = Field(
        default=None, description="When this fact was last observed/verified. None => unknown freshness (a data gap)."
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    is_simulated: bool = Field(default=True, description="True for demo/prototype data, false once real feeds are wired in.")


class Settlement(BaseModel):
    id: str
    name: str
    population: int = Field(ge=0)
    vulnerable_population: int = Field(ge=0)
    hazard_severity: float = Field(ge=0.0, le=1.0)
    status: Severity = Severity.safe
    risk_score: Optional[float] = None
    assigned_shelter_id: Optional[str] = None
    assigned_route_id: Optional[str] = None
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))

    @field_validator("vulnerable_population")
    @classmethod
    def vulnerable_not_exceed_population(cls, v, info):
        pop = info.data.get("population")
        if pop is not None and v > pop:
            raise ValueError("vulnerable_population cannot exceed population")
        return v


class RoadEdge(BaseModel):
    id: str
    label: str
    from_id: str = Field(alias="from")
    to_id: str = Field(alias="to")
    status: EdgeStatus = EdgeStatus.open
    is_bridge_dependent: bool = False
    bridge_id: Optional[str] = None
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))

    model_config = {"populate_by_name": True}


class Bridge(BaseModel):
    id: str
    name: str
    status: EdgeStatus = EdgeStatus.open
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))


class Shelter(BaseModel):
    id: str
    name: str
    capacity: int = Field(ge=0)
    occupied: int = Field(ge=0, default=0)
    status: ShelterStatus = ShelterStatus.ready
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))

    @property
    def available(self) -> int:
        return max(0, self.capacity - self.occupied)


class Hospital(BaseModel):
    id: str
    name: str
    capacity: Optional[int] = None
    accessible: bool = True
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))


class RescueResource(BaseModel):
    id: str
    name: str
    kind: str = Field(default="rescue_team", description="rescue_team | ambulance | bus | generator | ...")
    available: bool = True
    current_assignment_settlement_id: Optional[str] = None
    eta_minutes_by_settlement: dict[str, float] = Field(default_factory=dict)
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))


class ActiveTask(BaseModel):
    id: str
    title: str
    department: Department
    priority: str = "P2"
    status: TaskStatus = TaskStatus.pending
    reason_code: str
    settlement_id: Optional[str] = None
    created_at_sec: int = 0
    sla_seconds: int = 0


class HistoricalEvent(BaseModel):
    id: str
    at: Optional[datetime] = None
    label: str
    detail: str = ""


class Alert(BaseModel):
    id: str
    headline: str
    hazard_type: str = "flood"
    rain_intensity_percent: float = Field(default=0.0, description="Relative intensity change applied to the base scenario, 0 = baseline.")
    provenance: Provenance = Field(default_factory=lambda: Provenance(source="unspecified", is_simulated=True))


class SourceMetadata(BaseModel):
    generated_by: str = "sankat-setu-v1-seed"
    schema_version: str = "0.4.0"
    notes: Optional[str] = None


class ScenarioSnapshot(BaseModel):
    scenario_id: str
    timestamp: datetime
    alerts: list[Alert] = Field(default_factory=list)
    settlements: list[Settlement] = Field(default_factory=list)
    roads: list[RoadEdge] = Field(default_factory=list)
    bridges: list[Bridge] = Field(default_factory=list)
    shelters: list[Shelter] = Field(default_factory=list)
    hospitals: list[Hospital] = Field(default_factory=list)
    resources: list[RescueResource] = Field(default_factory=list)
    active_tasks: list[ActiveTask] = Field(default_factory=list)
    historical_events: list[HistoricalEvent] = Field(default_factory=list)
    source_metadata: SourceMetadata = Field(default_factory=SourceMetadata)

    def settlement(self, sid: str) -> Optional[Settlement]:
        return next((s for s in self.settlements if s.id == sid), None)

    def shelter(self, shid: str) -> Optional[Shelter]:
        return next((s for s in self.shelters if s.id == shid), None)

    def bridge(self, bid: str) -> Optional[Bridge]:
        return next((b for b in self.bridges if b.id == bid), None)

    def edges_from(self, settlement_id: str) -> list[RoadEdge]:
        return [e for e in self.roads if e.from_id == settlement_id]
