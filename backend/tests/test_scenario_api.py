from app.services.seed_service import DEMO_SCENARIO_ID


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_openapi_docs_load(client):
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    assert resp.json()["info"]["title"] == "SANKAT-SETU Data Backbone"


def test_scenario_state_returns_normalized_operational_state(client):
    resp = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/state")
    assert resp.status_code == 200
    body = resp.json()
    assert body["scenario"]["id"] == DEMO_SCENARIO_ID
    assert len(body["settlements"]) == 4
    assert {s["id"] for s in body["settlements"]} == {"alpha", "beta", "gamma", "delta"}
    assert len(body["shelters"]) == 2
    assert len(body["bridges"]) == 1
    assert body["bridges"][0]["id"] == "bridge-3"


def test_scenario_state_serializes_and_round_trips(client):
    resp = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/state")
    body = resp.json()
    # Every settlement must carry provenance so simulated data can never be
    # mistaken for verified official data (V0.3 spec item 6).
    for settlement in body["settlements"]:
        assert settlement["provenance"]["is_simulated"] is True
        assert "source" in settlement["provenance"]


def test_simulated_data_is_never_indistinguishable_from_official(client):
    resp = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/state")
    body = resp.json()
    for bridge in body["bridges"]:
        assert bridge["provenance"]["is_simulated"] is True
    for road in body["roads"]:
        assert road["provenance"]["is_simulated"] is True


def test_scenario_start_creates_a_snapshot(client):
    resp = client.post(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/start")
    assert resp.status_code == 200

    snaps = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/snapshots")
    assert snaps.status_code == 200
    reasons = [s["reason"] for s in snaps.json()]
    assert "scenario_start" in reasons


def test_snapshot_detail_returns_full_state(client):
    client.post(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/start")
    snaps = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/snapshots").json()
    snapshot_id = snaps[0]["id"]

    detail = client.get(f"/api/v1/scenarios/{DEMO_SCENARIO_ID}/snapshots/{snapshot_id}")
    assert detail.status_code == 200
    assert "state" in detail.json()
    assert detail.json()["state"]["scenario"]["id"] == DEMO_SCENARIO_ID


def test_scenario_not_found_returns_404(client):
    resp = client.get("/api/v1/scenarios/does-not-exist/state")
    assert resp.status_code == 404


def test_alerts_listing_includes_seeded_alert(client):
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 200
    headlines = [a["headline"] for a in resp.json()]
    assert any("Rainfall Warning" in h for h in headlines)


def test_cap_alert_ingest_endpoint(client):
    import json
    from app.adapters.cap_adapter import FIXTURES_DIR

    raw = json.loads((FIXTURES_DIR / "cap_landslide.json").read_text())
    resp = client.post("/api/v1/alerts/ingest/cap", json=raw)
    assert resp.status_code == 200
    body = resp.json()
    assert body["hazard_type"] == "landslide"
    assert body["provenance"]["is_simulated"] is True


def test_cap_alert_ingest_rejects_malformed_payload(client):
    resp = client.post("/api/v1/alerts/ingest/cap", json={"identifier": "bad"})
    assert resp.status_code == 422


def test_cap_update_then_cancel_lifecycle(client):
    import json
    from app.adapters.cap_adapter import FIXTURES_DIR

    fresh_alert = json.loads((FIXTURES_DIR / "cap_flash_flood.json").read_text())
    ingest_resp = client.post("/api/v1/alerts/ingest/cap", json=fresh_alert)
    assert ingest_resp.status_code == 200

    cancel_alert = dict(fresh_alert)
    cancel_alert["msgType"] = "Cancel"
    cancel_alert["sent"] = "2026-08-30T20:00:00+05:30"
    cancel_resp = client.post("/api/v1/alerts/ingest/cap", json=cancel_alert)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["lifecycle_status"] == "cancelled"
    assert cancel_resp.json()["supersedes_id"] is not None
