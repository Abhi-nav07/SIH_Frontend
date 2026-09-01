from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import GeoPointMixin, ProvenanceMixin, utcnow


class RoadStatus(StrEnum):
    OPEN = "open"
    RESTRICTED = "restricted"
    BLOCKED = "blocked"
    CONFLICT = "conflict"
    UNKNOWN = "unknown"


class OperationalStatus(StrEnum):
    OPERATIONAL = "operational"
    LIMITED = "limited"
    NON_OPERATIONAL = "non_operational"
    UNKNOWN = "unknown"


class Settlement(Base, ProvenanceMixin, GeoPointMixin):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    district: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vulnerable_population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Free-text risk metadata (e.g. "near river corridor") — not a scored
    # field; scoring stays in the existing frontend risk engine for now.
    risk_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)


class RoadSegment(Base, ProvenanceMixin):
    __tablename__ = "road_segments"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # GeoJSON LineString, stored as text (see events.py note on geometry).
    geometry_geojson: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=RoadStatus.OPEN.value)
    conflicting_sources: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list, set on CONFLICT
    depends_on_bridge_id: Mapped[str | None] = mapped_column(
        ForeignKey("bridges.id"), nullable=True
    )


class Bridge(Base, ProvenanceMixin, GeoPointMixin):
    __tablename__ = "bridges"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=RoadStatus.OPEN.value)
    conflicting_sources: Mapped[str | None] = mapped_column(Text, nullable=True)
    dependent_route_ids: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list of RoadSegment ids


class Shelter(Base, ProvenanceMixin, GeoPointMixin):
    __tablename__ = "shelters"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    occupied: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    operational_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=OperationalStatus.OPERATIONAL.value
    )
    accessibility: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Hospital(Base, ProvenanceMixin, GeoPointMixin):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    emergency_beds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_beds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    operational_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=OperationalStatus.OPERATIONAL.value
    )


class ResponseResource(Base, ProvenanceMixin, GeoPointMixin):
    __tablename__ = "response_resources"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    type: Mapped[str] = mapped_column(String(80), nullable=False)  # e.g. "rescue_team", "ambulance", "generator"
    agency: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    availability: Mapped[str] = mapped_column(String(20), nullable=False, default="available")
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="ready")


class VerificationRecord(Base):
    """Audit trail of manual field verifications (V0.3 spec item 15).

    Kept as an append-only log — POST /assets/{id}/verify writes a new row
    here in addition to updating the asset's own provenance columns, so the
    full verification history survives even after the asset's current state
    changes again.
    """

    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_type: Mapped[str] = mapped_column(String(40), nullable=False)  # "road_segment" | "bridge" | ...
    asset_id: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    verified_by: Mapped[str] = mapped_column(String(200), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
