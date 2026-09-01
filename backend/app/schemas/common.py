from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Provenance(BaseModel):
    """Mirrors ProvenanceMixin — attached to every critical API object.

    is_simulated is the load-bearing field for V0.3 spec item 6: the
    frontend must never be able to mistake demo data for verified official
    data, so this is always present and never inferred client-side.
    """

    source: str
    source_id: str | None = None
    observed_at: datetime | None = None
    received_at: datetime
    last_verified_at: datetime | None = None
    verified_by: str | None = None
    is_simulated: bool


class FreshnessInfo(BaseModel):
    status: str = Field(description="FRESH | STALE | EXPIRED | UNKNOWN")
    age_hours: float | None = None


class ConfidenceInfo(BaseModel):
    score: int = Field(ge=0, le=100)
    reason: str


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: tuple[float, float]  # [lon, lat] — GeoJSON order


def to_point_geojson(lat: float, lon: float) -> GeoPoint:
    return GeoPoint(coordinates=(lon, lat))
