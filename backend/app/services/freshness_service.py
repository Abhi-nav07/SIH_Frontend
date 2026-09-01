"""Freshness engine (V0.3 spec item 7).

Classifies a data point's age against configurable thresholds instead of
letting the UI infer freshness itself. Thresholds live in app/core/config.py
so they're centrally tunable, not hardcoded per-caller.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum

from app.core.config import Settings


class Freshness(StrEnum):
    FRESH = "FRESH"
    STALE = "STALE"
    EXPIRED = "EXPIRED"
    UNKNOWN = "UNKNOWN"


def _hours_since(observed_at: datetime, now: datetime) -> float:
    if observed_at.tzinfo is None:
        observed_at = observed_at.replace(tzinfo=timezone.utc)
    return (now - observed_at).total_seconds() / 3600.0


def classify_freshness(
    observed_at: datetime | None,
    *,
    stale_after_hours: float,
    expired_after_hours: float,
    now: datetime | None = None,
) -> Freshness:
    """Pure, deterministic classification — no ML, fully auditable.

    Returns UNKNOWN when there's no timestamp to judge at all (e.g. a record
    that has never been observed/verified).
    """
    if observed_at is None:
        return Freshness.UNKNOWN

    now = now or datetime.now(timezone.utc)
    age_hours = _hours_since(observed_at, now)

    if age_hours < 0:
        # Clock skew / bad data — treat conservatively as stale rather than
        # silently trusting a future timestamp.
        return Freshness.STALE
    if age_hours >= expired_after_hours:
        return Freshness.EXPIRED
    if age_hours >= stale_after_hours:
        return Freshness.STALE
    return Freshness.FRESH


def road_freshness(observed_at: datetime | None, settings: Settings, now: datetime | None = None) -> Freshness:
    return classify_freshness(
        observed_at,
        stale_after_hours=settings.road_status_stale_hours,
        expired_after_hours=settings.road_status_expired_hours,
        now=now,
    )


def bridge_freshness(observed_at: datetime | None, settings: Settings, now: datetime | None = None) -> Freshness:
    return classify_freshness(
        observed_at,
        stale_after_hours=settings.bridge_verification_stale_hours,
        expired_after_hours=settings.bridge_verification_expired_hours,
        now=now,
    )


def shelter_freshness(observed_at: datetime | None, settings: Settings, now: datetime | None = None) -> Freshness:
    return classify_freshness(
        observed_at,
        stale_after_hours=settings.shelter_verification_stale_days * 24,
        expired_after_hours=settings.shelter_verification_expired_days * 24,
        now=now,
    )


def default_freshness(observed_at: datetime | None, settings: Settings, now: datetime | None = None) -> Freshness:
    return classify_freshness(
        observed_at,
        stale_after_hours=settings.default_stale_hours,
        expired_after_hours=settings.default_expired_hours,
        now=now,
    )


def alert_lifecycle_status(
    effective_from: datetime,
    expires_at: datetime | None,
    is_cancelled: bool,
    now: datetime | None = None,
) -> str:
    """Alert-specific lifecycle status, distinct from asset freshness.

    Returns one of: "cancelled", "expired", "pending", "active".
    """
    now = now or datetime.now(timezone.utc)
    if is_cancelled:
        return "cancelled"
    if expires_at is not None:
        expires = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
        if now >= expires:
            return "expired"
    effective = effective_from if effective_from.tzinfo else effective_from.replace(tzinfo=timezone.utc)
    if now < effective:
        return "pending"
    return "active"
