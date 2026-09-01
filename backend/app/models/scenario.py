from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import utcnow


class ScenarioPhase(StrEnum):
    IDLE = "idle"
    WARNING = "warning"
    ACTIVE = "active"
    REPLANNED = "replanned"


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    district: Mapped[str] = mapped_column(String(120), nullable=False, default="Uttarakhand")
    phase: Mapped[str] = mapped_column(String(20), nullable=False, default=ScenarioPhase.IDLE.value)
    clock_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class ScenarioSnapshotReason(StrEnum):
    SCENARIO_START = "scenario_start"
    ALERT_UPDATE = "alert_update"
    INFRASTRUCTURE_CHANGE = "infrastructure_change"
    REPLAN_TRIGGER = "replan_trigger"
    MANUAL_VERIFICATION = "manual_verification"


class ScenarioSnapshot(Base):
    """Point-in-time capture of full scenario state (V0.3 spec item 9).

    `state_json` holds the serialized ScenarioState so after-action replay,
    audit, and judge-demo comparison don't depend on replaying every event.
    """

    __tablename__ = "scenario_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scenario_id: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(40), nullable=False)
    state_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
