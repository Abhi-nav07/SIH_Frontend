def test_shelters_endpoint_lists_seeded_shelters(client):
    resp = client.get("/api/v1/shelters")
    assert resp.status_code == 200
    ids = {s["id"] for s in resp.json()}
    assert ids == {"shelter-a", "shelter-b"}


def test_shelter_capacity_never_negative_and_occupied_within_capacity(client):
    resp = client.get("/api/v1/shelters")
    for shelter in resp.json():
        assert shelter["capacity"] >= 0
        assert 0 <= shelter["occupied"] <= shelter["capacity"]


def test_hospitals_endpoint_lists_seeded_hospital(client):
    resp = client.get("/api/v1/hospitals")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == "hospital"
    assert resp.json()[0]["available_beds"] <= resp.json()[0]["emergency_beds"]


def test_resources_endpoint_lists_seeded_resources(client):
    resp = client.get("/api/v1/resources")
    assert resp.status_code == 200
    types = {r["type"] for r in resp.json()}
    assert "rescue_team" in types


def test_assets_endpoint_lists_roads_and_bridges(client):
    resp = client.get("/api/v1/assets")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["road_segments"]) == 4
    assert len(body["bridges"]) == 1


def test_every_shelter_carries_freshness_and_provenance(client):
    resp = client.get("/api/v1/shelters")
    for shelter in resp.json():
        assert shelter["freshness"]["status"] in {"FRESH", "STALE", "EXPIRED", "UNKNOWN"}
        assert "source" in shelter["provenance"]
