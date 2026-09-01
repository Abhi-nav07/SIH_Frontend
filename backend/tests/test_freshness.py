from datetime import datetime, timedelta, timezone

from app.core.config import Settings
from app.services.freshness_service import (
    Freshness,
    alert_lifecycle_status,
    classify_freshness,
    road_freshness,
)

SETTINGS = Settings()
NOW = datetime(2026, 8, 30, 12, 0, tzinfo=timezone.utc)


def test_freshness_unknown_when_no_timestamp():
    assert classify_freshness(None, stale_after_hours=6, expired_after_hours=24) == Freshness.UNKNOWN


def test_freshness_fresh_within_threshold():
    observed = NOW - timedelta(hours=1)
    assert classify_freshness(observed, stale_after_hours=6, expired_after_hours=24, now=NOW) == Freshness.FRESH


def test_freshness_stale_between_thresholds():
    observed = NOW - timedelta(hours=10)
    assert classify_freshness(observed, stale_after_hours=6, expired_after_hours=24, now=NOW) == Freshness.STALE


def test_freshness_expired_past_expiry_threshold():
    observed = NOW - timedelta(hours=30)
    assert classify_freshness(observed, stale_after_hours=6, expired_after_hours=24, now=NOW) == Freshness.EXPIRED


def test_road_status_freshness_uses_configured_road_thresholds():
    # road_status_stale_hours default is 6.0 — 5 hours old should be FRESH.
    observed = NOW - timedelta(hours=5)
    assert road_freshness(observed, SETTINGS, now=NOW) == Freshness.FRESH
    observed = NOW - timedelta(hours=7)
    assert road_freshness(observed, SETTINGS, now=NOW) == Freshness.STALE


def test_alert_lifecycle_active():
    status = alert_lifecycle_status(
        effective_from=NOW - timedelta(hours=1),
        expires_at=NOW + timedelta(hours=10),
        is_cancelled=False,
        now=NOW,
    )
    assert status == "active"


def test_alert_lifecycle_expired_after_expiry_time():
    status = alert_lifecycle_status(
        effective_from=NOW - timedelta(hours=50),
        expires_at=NOW - timedelta(hours=1),
        is_cancelled=False,
        now=NOW,
    )
    assert status == "expired"


def test_alert_lifecycle_cancelled_flag_wins_even_if_still_within_window():
    status = alert_lifecycle_status(
        effective_from=NOW - timedelta(hours=1),
        expires_at=NOW + timedelta(hours=10),
        is_cancelled=True,
        now=NOW,
    )
    assert status == "cancelled"


def test_alert_lifecycle_pending_before_effective_time():
    status = alert_lifecycle_status(
        effective_from=NOW + timedelta(hours=2),
        expires_at=NOW + timedelta(hours=10),
        is_cancelled=False,
        now=NOW,
    )
    assert status == "pending"
