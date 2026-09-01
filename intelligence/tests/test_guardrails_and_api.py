from fastapi.testclient import TestClient

from app.main import app
from app.rules.decision_engine import generate_recommendations
from app.services.allocation import allocate_resources

client = TestClient(app)


# 15. all outputs preserve is_simulated
def test_recommendations_preserve_is_simulated(baseline_snapshot):
    result = generate_recommendations(baseline_snapshot)
    for rec in result.recommendations:
        assert rec.is_simulated is True  # baseline fixture is fully simulated


# 16. human confirmation requirement present
def test_human_confirmation_required_on_recommendations(baseline_snapshot):
    result = generate_recommendations(baseline_snapshot)
    for rec in result.recommendations:
        assert rec.status == "REQUIRES OFFICER CONFIRMATION"


def test_human_confirmation_required_on_resource_allocation(baseline_snapshot):
    result = allocate_resources(baseline_snapshot)
    for a in result.assignments:
        assert a.status == "REQUIRES OFFICER CONFIRMATION"


# 17. health endpoint works
def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_recommendations_endpoint_via_api(baseline_snapshot):
    payload = baseline_snapshot.model_dump(mode="json", by_alias=True)
    resp = client.post("/api/v1/decision/recommendations", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["scenario_id"] == "UK_FF_001"
    assert len(body["recommendations"]) > 0


def test_copilot_brief_endpoint_via_api(baseline_snapshot):
    payload = {"scenario_snapshot": baseline_snapshot.model_dump(mode="json", by_alias=True)}
    resp = client.post("/api/v1/copilot/brief", json=payload)
    assert resp.status_code == 200
    assert len(resp.json()["top_actions"]) > 0
