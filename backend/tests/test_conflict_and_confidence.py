from app.core.config import Settings
from app.services.confidence_service import compute_confidence
from app.services.conflict_service import resolve_status_update
from app.services.freshness_service import Freshness

SETTINGS = Settings()


def test_conflicting_sources_flagged_not_silently_overwritten():
    resolution = resolve_status_update(
        current_status="open",
        current_source="pwd.uk.gov.in",
        current_observed_at="2026-08-30T08:00:00+00:00",
        incoming_status="blocked",
        incoming_source="field:PWD_FIELD_TEAM_04",
        incoming_observed_at="2026-08-30T09:00:00+00:00",
    )
    assert resolution.status == "conflict"
    assert resolution.has_conflict is True
    assert len(resolution.conflicting_sources) == 2


def test_agreeing_sources_do_not_conflict():
    resolution = resolve_status_update(
        current_status="blocked",
        current_source="pwd.uk.gov.in",
        current_observed_at="2026-08-30T08:00:00+00:00",
        incoming_status="blocked",
        incoming_source="another.source",
        incoming_observed_at="2026-08-30T09:00:00+00:00",
    )
    assert resolution.status == "blocked"
    assert resolution.has_conflict is False


def test_same_source_correction_does_not_conflict():
    resolution = resolve_status_update(
        current_status="blocked",
        current_source="pwd.uk.gov.in",
        current_observed_at="2026-08-30T08:00:00+00:00",
        incoming_status="open",
        incoming_source="pwd.uk.gov.in",
        incoming_observed_at="2026-08-30T09:00:00+00:00",
    )
    assert resolution.has_conflict is False
    assert resolution.status == "open"


def test_manual_verification_supersedes_conflict():
    resolution = resolve_status_update(
        current_status="conflict",
        current_source="mixed",
        current_observed_at="2026-08-30T08:00:00+00:00",
        incoming_status="blocked",
        incoming_source="field:PWD_FIELD_TEAM_04",
        incoming_observed_at="2026-08-30T09:00:00+00:00",
        manual_override=True,
    )
    assert resolution.status == "blocked"
    assert resolution.has_conflict is False
    assert resolution.conflicting_sources is None


def test_confidence_high_for_fresh_manually_verified_no_conflict():
    result = compute_confidence(
        source_reliability=0.9,
        freshness=Freshness.FRESH,
        manually_verified=True,
        has_conflict=False,
        settings=SETTINGS,
    )
    assert result.score >= 85
    assert "manually field-verified" in result.reason


def test_confidence_low_for_stale_conflicting_unverified():
    result = compute_confidence(
        source_reliability=0.5,
        freshness=Freshness.EXPIRED,
        manually_verified=False,
        has_conflict=True,
        settings=SETTINGS,
    )
    assert result.score < 40
    assert "conflicting sources" in result.reason


def test_confidence_score_bounded_0_to_100():
    result = compute_confidence(
        source_reliability=1.5,  # deliberately out of range input
        freshness=Freshness.FRESH,
        manually_verified=True,
        has_conflict=False,
        settings=SETTINGS,
    )
    assert 0 <= result.score <= 100
