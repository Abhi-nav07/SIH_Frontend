from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.schemas.common import ConfidenceInfo, FreshnessInfo, GeoPoint, Provenance


class SettlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    district: str
    state: str
    population: int
    vulnerable_population: int
    location: GeoPoint
    provenance: Provenance


class RoadSegmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    status: str
    conflicting_sources: list[dict] | None
    depends_on_bridge_id: str | None
    provenance: Provenance
    freshness: FreshnessInfo
    confidence: ConfidenceInfo


class BridgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    status: str
    location: GeoPoint
    conflicting_sources: list[dict] | None
    dependent_route_ids: list[str]
    provenance: Provenance
    freshness: FreshnessInfo
    confidence: ConfidenceInfo


class ShelterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    capacity: int
    occupied: int
    operational_status: str
    accessibility: str | None
    location: GeoPoint
    provenance: Provenance
    freshness: FreshnessInfo


class HospitalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    emergency_beds: int
    available_beds: int
    operational_status: str
    location: GeoPoint
    provenance: Provenance
    freshness: FreshnessInfo


class ResponseResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    agency: str
    quantity: int
    availability: str
    status: str
    location: GeoPoint
    provenance: Provenance
    freshness: FreshnessInfo


class VerifyAssetRequest(BaseModel):
    status: str
    verified_by: str
    observed_at: str  # ISO datetime string, per spec payload example
    notes: str | None = None


class VerifyAssetResponse(BaseModel):
    asset_type: str
    asset_id: str
    status: str
    verified_by: str
    superseded_conflict: bool
    confidence: ConfidenceInfo
