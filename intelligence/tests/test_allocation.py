from app.services.allocation import allocate_resources, allocate_shelter_for_settlement


# 7. shelter overload detected
def test_shelter_overload_detected(baseline_snapshot):
    snapshot = baseline_snapshot.model_copy(deep=True)
    # Force tiny shelter capacity to guarantee overload for Alpha's 1450 pop.
    snapshot.shelters[0].capacity = 100
    snapshot.shelters[0].occupied = 0
    snapshot.shelters[1].capacity = 100
    snapshot.shelters[1].occupied = 0
    result = allocate_shelter_for_settlement(snapshot, "alpha")
    assert result.overload_warning is True
    assert result.unmet_capacity > 0


# 8. shelter allocation never exceeds capacity
def test_shelter_allocation_never_exceeds_capacity(baseline_snapshot):
    result = allocate_shelter_for_settlement(baseline_snapshot, "alpha")
    for line in result.allocations:
        assert line.allocated <= line.available_before


# 9. resource allocation avoids unavailable team
def test_resource_allocation_avoids_unavailable_team(baseline_snapshot):
    snapshot = baseline_snapshot.model_copy(deep=True)
    snapshot.resources[0].available = False  # R1 unavailable
    result = allocate_resources(snapshot)
    used_ids = {a.resource_id for a in result.assignments}
    assert "r1" not in used_ids


def test_resource_allocation_produces_assignments(baseline_snapshot):
    result = allocate_resources(baseline_snapshot)
    assert len(result.assignments) > 0
    for a in result.assignments:
        assert a.status == "REQUIRES OFFICER CONFIRMATION"
