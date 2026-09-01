"""Shared ORM mixins.

ProvenanceMixin implements V0.3 spec item 6: every critical record must be
able to answer "where did this come from, when, and how sure are we."
Never let simulated demo data look like verified official data — is_simulated
defaults to True and must be explicitly set False by a real adapter/import.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProvenanceMixin:
    source: Mapped[str] = mapped_column(String(120), nullable=False, default="simulated")
    source_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class GeoPointMixin:
    """Portable lat/lon columns.

    Production (Postgres) should additionally maintain a PostGIS
    Geography(Point, 4326) column — omitted from the SQLite-compatible dev
    schema here since SpatiaLite is not assumed to be installed. Keeping
    lat/lon as the canonical columns means the API contract (GeoJSON out)
    doesn't change when a real geometry column is added later; see
    app/schemas/common.py:to_point_geojson.
    """

    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
