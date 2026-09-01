from datetime import datetime, timezone

from app.services.seed_service import DEMO_SCENARIO_ID, seed_demo_scenario


def test_verify_asset_endpoint_updates_status_and_provenance(client):
    resp = client.post(
        "/api/v1/assets/bridge-3/verify",
        params={"asset_type": "bridge"},
        json={
            "status": "blocked",
            "verified_by": "PWD_FIELD_TEAM_04",
            "observed_at": "2026-08-30T10:00:00+00:00",
            "notes": "Debris across carriageway",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "blocked"
    assert body["verified_by"] == "PWD_FIELD_TEAM_04"
    assert body["confidence"]["score"] >= 80  # manual verification -> high confidence


def test_verified_bridge_is_no_longer_marked_simulated(client):
    client.post(
        "/api/v1/assets/bridge-3/verify",
        params={"asset_type": "bridge"},
        json={
            "status": "blocked",
            "verified_by": "PWD_FIELD_TEAM_04",
            "observed_at": "2026-08-30T10:00:00+00:00",
        },
    )
    state = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/state").json()
    bridge = next(b for b in state["bridges"] if b["id"] == "bridge-3")
    assert bridge["status"] == "blocked"
    assert bridge["provenance"]["is_simulated"] is False
    assert bridge["provenance"]["verified_by"] == "PWD_FIELD_TEAM_04"


def test_verify_unknown_asset_returns_404(client):
    resp = client.post(
        "/api/v1/assets/does-not-exist/verify",
        params={"asset_type": "bridge"},
        json={"status": "blocked", "verified_by": "X", "observed_at": "2026-08-30T10:00:00+00:00"},
    )
    assert resp.status_code == 404


def test_verify_invalid_asset_type_returns_400(client):
    resp = client.post(
        "/api/v1/assets/bridge-3/verify",
        params={"asset_type": "not_a_type"},
        json={"status": "blocked", "verified_by": "X", "observed_at": "2026-08-30T10:00:00+00:00"},
    )
    assert resp.status_code == 400


def test_verify_bad_observed_at_returns_422(client):
    resp = client.post(
        "/api/v1/assets/bridge-3/verify",
        params={"asset_type": "bridge"},
        json={"status": "blocked", "verified_by": "X", "observed_at": "not-a-date"},
    )
    assert resp.status_code == 422


def test_conflicting_automated_updates_surface_as_conflict(db_session):
    from app.repositories import asset_repo

    seed_demo_scenario(db_session)

    asset_repo.apply_status_update(
        db_session,
        asset_type="bridge",
        asset_id="bridge-3",
        incoming_status="open",
        incoming_source="source_a",
        incoming_observed_at=datetime(2026, 8, 30, 8, 0, tzinfo=timezone.utc),
    )
    bridge, had_conflict = asset_repo.apply_status_update(
        db_session,
        asset_type="bridge",
        asset_id="bridge-3",
        incoming_status="blocked",
        incoming_source="source_b",
        incoming_observed_at=datetime(2026, 8, 30, 9, 0, tzinfo=timezone.utc),
    )
    assert bridge.status == "conflict"
    assert had_conflict is True
    assert bridge.conflicting_sources is not None


def test_manual_verification_clears_prior_conflict(db_session):
    from app.repositories import asset_repo

    seed_demo_scenario(db_session)
    asset_repo.apply_status_update(
        db_session, asset_type="bridge", asset_id="bridge-3",
        incoming_status="open", incoming_source="source_a",
        incoming_observed_at=datetime(2026, 8, 30, 8, 0, tzinfo=timezone.utc),
    )
    asset_repo.apply_status_update(
        db_session, asset_type="bridge", asset_id="bridge-3",
        incoming_status="blocked", incoming_source="source_b",
        incoming_observed_at=datetime(2026, 8, 30, 9, 0, tzinfo=timezone.utc),
    )
    bridge, had_conflict = asset_repo.apply_status_update(
        db_session, asset_type="bridge", asset_id="bridge-3",
        incoming_status="blocked", incoming_source="field:PWD_FIELD_TEAM_04",
        incoming_observed_at=datetime(2026, 8, 30, 10, 0, tzinfo=timezone.utc),
        manual_override=True, verified_by="PWD_FIELD_TEAM_04",
    )
    assert bridge.status == "blocked"
    assert bridge.conflicting_sources is None
