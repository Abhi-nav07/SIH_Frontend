from app.schemas.outputs import WhatIfChange, WhatIfChangeType
from app.simulator.whatif import compare_scenarios, run_what_if


# 5. bridge failure changes route-dependent recommendation
def test_bridge_failure_changes_route_recommendation(baseline_snapshot):
    before = run_what_if(baseline_snapshot, [])
    change = WhatIfChange(type=WhatIfChangeType.BRIDGE_FAILURE, target_id="bridge-3")
    after = run_what_if(baseline_snapshot, [change])

    alpha_before = next(r for r in before.recommendations.recommendations if r.target == "Village Alpha")
    alpha_after = next(r for r in after.recommendations.recommendations if r.target == "Village Alpha")
    assert alpha_after.score >= alpha_before.score
    assert any("Bridge" in step.description or "invalidated" in step.description for step in after.impact_chain)


# 6. bridge failure changes isolation risk / route failure reason code
def test_bridge_failure_adds_route_failure_reason_code(baseline_snapshot):
    change = WhatIfChange(type=WhatIfChangeType.BRIDGE_FAILURE, target_id="bridge-3")
    result = run_what_if(baseline_snapshot, [change])
    alpha_rec = next(r for r in result.recommendations.recommendations if r.target == "Village Alpha")
    assert "ROUTE_FAILURE_RISK" in [c.value for c in alpha_rec.reason_codes]


# 10. what-if comparison calculates deltas
def test_compare_calculates_deltas(baseline_snapshot):
    change = WhatIfChange(type=WhatIfChangeType.BRIDGE_FAILURE, target_id="bridge-3")
    result = compare_scenarios(baseline_snapshot, [change])
    assert result.delta["primary_routes_blocked"] == 2  # main-alpha-a + main-beta-a
    assert isinstance(result.narrative, list)


def test_rain_intensity_change_increases_hazard(baseline_snapshot):
    change = WhatIfChange(type=WhatIfChangeType.RAIN_INTENSITY_CHANGE, value_percent=30)
    result = run_what_if(baseline_snapshot, [change])
    assert result.recommendations.scenario_id == "UK_FF_001"
    assert any("Rainfall intensity" in step.description for step in result.impact_chain)
