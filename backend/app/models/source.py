from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Source(Base):
    """Registry of upstream data sources (V0.3 spec item 13).

    Describing agencies/adapters in one table keeps the architecture
    integration-ready without hardcoding agency names throughout the code.
    """

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    agency: Mapped[str] = mapped_column(String(120), nullable=False)
    adapter_type: Mapped[str] = mapped_column(String(60), nullable=False)  # e.g. "cap_alert", "manual"
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    polling_interval_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    authentication_type: Mapped[str] = mapped_column(String(60), nullable=False, default="none")
    # Deterministic, hand-set reliability prior (0-1) used by the confidence
    # engine — not learned/ML, just a documented per-source weight.
    reliability_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    last_success: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
