from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import Provenance


class DisasterEventIn(BaseModel):
    """What an adapter produces — not yet persisted, no DB id."""

    source: str
    source_event_id: str
    lifecycle: str = "new"
    hazard_type: str
    severity: str
    certainty: str = "unknown"
    headline: str
    description: str = ""
    issued_at: datetime
    effective_from: datetime
    expires_at: datetime | None = None
    geometry_geojson: str | None = None
    affected_area: str | None = None
    metadata_json: str | None = None
    is_simulated: bool = True
    confidence: float = 0.7


class DisasterEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_event_id: str
    lifecycle: str
    hazard_type: str
    severity: str
    certainty: str
    headline: str
    description: str
    issued_at: datetime
    effective_from: datetime
    expires_at: datetime | None
    affected_area: str | None
    supersedes_id: int | None
    lifecycle_status: str  # computed: active/expired/cancelled/pending
    provenance: Provenance
