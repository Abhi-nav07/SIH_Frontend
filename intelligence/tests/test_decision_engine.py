from datetime import datetime, timedelta, timezone

from app.rules.decision_engine import generate_recommendations
from app.schemas.scenario import Provenance


# 1. recommendation generation from scenario snapshot
def test_recommendation_generation(baseline_snapshot):
    result = generate_recommendations(baseline_snapshot)
    assert result.scenario_id == "UK_FF_001"
    assert len(result.recommendations) > 0
    # Alpha has highest hazard/population -> should rank first
    assert result.recommendations[0].target == "Village Alpha"


# 2. recommendation evidence present
def test_recommendation_evidence_present(baseline_snapshot):
    result = generate_recommendations(baseline_snapshot)
    for rec in result.recommendations:
        assert len(rec.evidence) > 0
        keys = {e.key for e in rec.evidence}
        assert "flood_risk_score" in keys
        assert "population" in keys


# 3. low-confidence input produces warning
def test_low_confidence_produces_low_confidence_score(baseline_snapshot):
    low_conf = Provenance(source="unverified field report", confidence=0.2, is_simulated=True)
    snapshot = baseline_snapshot.model_copy(deep=True)
    snapshot.settlements[0].provenance = low_conf
    result = generate_recommendations(snapshot)
    alpha_rec = next(r for r in result.recommendations if r.target == "Village Alpha")
    assert alpha_rec.confidence <= 0.2


# 4. missing data produces data-gap output
def test_missing_data_produces_data_gap(baseline_snapshot):
    snapshot = baseline_snapshot.model_copy(deep=True)
    snapshot.shelters[0].provenance = Provenance(source="unspecified", observed_at=None, is_simulated=True)
    result = generate_recommendations(snapshot)
    assert any("not verified" in g.description for g in result.data_gaps)


def test_stale_road_produces_data_gap(baseline_snapshot):
    snapshot = baseline_snapshot.model_copy(deep=True)
    stale_time = datetime.now(timezone.utc) - timedelta(hours=9)
    snapshot.roads[0].provenance = Provenance(source="field report", observed_at=stale_time, confidence=0.9, is_simulated=True)
    result = generate_recommendations(snapshot, now=datetime.now(timezone.utc))
    assert any("stale" in g.description or "hours ago" in g.description for g in result.data_gaps)
