from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import ProvenanceMixin, utcnow


class HazardType(StrEnum):
    FLOOD = "flood"
    EXTREME_RAINFALL = "extreme_rainfall"
    LANDSLIDE = "landslide"
    EARTHQUAKE = "earthquake"
    WILDFIRE = "wildfire"
    CYCLONE = "cyclone"
    GENERIC = "generic"


class Severity(StrEnum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    EXTREME = "extreme"


class Certainty(StrEnum):
    OBSERVED = "observed"
    LIKELY = "likely"
    POSSIBLE = "possible"
    UNKNOWN = "unknown"


class AlertLifecycle(StrEnum):
    NEW = "new"
    UPDATE = "update"
    CANCEL = "cancel"
    EXPIRE = "expire"


class DisasterEvent(Base, ProvenanceMixin):
    """Canonical internal event model (V0.3 spec item 2).

    Extensible across hazard types on purpose — we are not building
    per-hazard intelligence yet, just a stable normalized shape that any
    adapter (CAP today, other feeds later) converts into.
    """

    __tablename__ = "disaster_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # `source` + `source_event_id` together identify the upstream alert so
    # updates/cancellations can be matched to the event they supersede.
    source_event_id: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    lifecycle: Mapped[str] = mapped_column(String(20), nullable=False, default=AlertLifecycle.NEW.value)

    hazard_type: Mapped[str] = mapped_column(String(40), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    certainty: Mapped[str] = mapped_column(String(20), nullable=False, default=Certainty.UNKNOWN.value)

    headline: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # GeoJSON geometry (Polygon/Point) for the affected area, stored as text.
    # Production Postgres should mirror this into a PostGIS Geography column
    # (see app/models/base.py:GeoPointMixin docstring for the same rationale).
    geometry_geojson: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_area: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # Free-form structured metadata from the source (kept as JSON text to
    # avoid coupling to a specific dialect's JSON column type on SQLite).
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # An update/cancel event points back at the event it supersedes so the
    # full lifecycle chain is auditable rather than overwritten in place.
    supersedes_id: Mapped[int | None] = mapped_column(
        ForeignKey("disaster_events.id"), nullable=True
    )
    supersedes: Mapped["DisasterEvent | None"] = relationship(remote_side=[id])

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
