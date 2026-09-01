"""
Baseline scenario snapshot mirroring frontend `lib/scenario/data.ts`
(Uttarakhand flash-flood vertical slice, MASTER_SPEC §3). Used by tests and
as a reference example for anyone wiring a real adapter later.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.schemas.scenario import (
    Alert,
    Bridge,
    Hospital,
    Provenance,
    RescueResource,
    RoadEdge,
    ScenarioSnapshot,
    Settlement,
    Shelter,
    SourceMetadata,
)

NOW = datetime(2026, 8, 30, 6, 0, 0, tzinfo=timezone.utc)


def build_baseline_snapshot(now: datetime | None = None) -> ScenarioSnapshot:
    now = now or NOW
    fresh = Provenance(source="simulated seed", observed_at=now - timedelta(minutes=5), confidence=0.95, is_simulated=True)

    settlements = [
        Settlement(
            id="alpha", name="Village Alpha", population=1450, vulnerable_population=220,
            hazard_severity=0.9, provenance=fresh,
        ),
        Settlement(
            id="beta", name="Village Beta", population=980, vulnerable_population=140,
            hazard_severity=0.62, provenance=fresh,
        ),
        Settlement(
            id="gamma", name="Village Gamma", population=640, vulnerable_population=95,
            hazard_severity=0.35, provenance=fresh,
        ),
        Settlement(
            id="delta", name="Village Delta", population=510, vulnerable_population=60,
            hazard_severity=0.22, provenance=fresh,
        ),
    ]

    roads = [
        RoadEdge(
            id="main-alpha-a", label="Main Road (Alpha -> Bridge-3 -> Shelter A)",
            **{"from": "alpha", "to": "shelter-a"}, status="open", is_bridge_dependent=True,
            bridge_id="bridge-3", provenance=fresh,
        ),
        RoadEdge(
            id="secondary-alpha-b", label="Secondary Road (Alpha -> Shelter B, longer)",
            **{"from": "alpha", "to": "shelter-b"}, status="open", is_bridge_dependent=False,
            provenance=fresh,
        ),
        RoadEdge(
            id="main-beta-a", label="Main Road (Beta -> Bridge-3 -> Shelter A)",
            **{"from": "beta", "to": "shelter-a"}, status="open", is_bridge_dependent=True,
            bridge_id="bridge-3", provenance=fresh,
        ),
        RoadEdge(
            id="hospital-link", label="Hospital Access Road",
            **{"from": "beta", "to": "hospital"}, status="open", is_bridge_dependent=False,
            provenance=fresh,
        ),
    ]

    bridges = [Bridge(id="bridge-3", name="Bridge-3", status="open", provenance=fresh)]

    shelters = [
        Shelter(id="shelter-a", name="Shelter A - Govt School", capacity=1600, occupied=0, status="ready", provenance=fresh),
        Shelter(id="shelter-b", name="Shelter B - Hill Camp", capacity=900, occupied=0, status="standby", provenance=fresh),
    ]

    hospitals = [Hospital(id="hospital", name="District Hospital", accessible=True, provenance=fresh)]

    resources = [
        RescueResource(
            id="r1", name="Rescue Team R1", kind="rescue_team", available=True,
            eta_minutes_by_settlement={"alpha": 18, "beta": 25}, provenance=fresh,
        ),
        RescueResource(
            id="r2", name="Rescue Team R2", kind="rescue_team", available=True,
            eta_minutes_by_settlement={"gamma": 10, "delta": 14}, provenance=fresh,
        ),
    ]

    alerts = [
        Alert(id="alert-1", headline="Extreme Rainfall + Flash Flood Risk", hazard_type="flood",
              rain_intensity_percent=0.0, provenance=fresh)
    ]

    return ScenarioSnapshot(
        scenario_id="UK_FF_001",
        timestamp=now,
        alerts=alerts,
        settlements=settlements,
        roads=roads,
        bridges=bridges,
        shelters=shelters,
        hospitals=hospitals,
        resources=resources,
        active_tasks=[],
        historical_events=[],
        source_metadata=SourceMetadata(generated_by="sankat-setu-v1-seed", notes="Mirrors lib/scenario/data.ts"),
    )
