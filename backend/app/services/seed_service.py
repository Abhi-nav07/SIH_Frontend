"""Deterministic Uttarakhand demo seed data (V0.3 "SEED DATA" section).

IMPORTANT: settlement/shelter/bridge ids here (alpha/beta/gamma/delta,
shelter-a/shelter-b, bridge-3) intentionally match lib/scenario/data.ts on
the frontend exactly, so a future ApiScenarioProvider swap doesn't require
remapping ids. Coordinates are FICTIONAL prototype placements (not surveyed
real-world coordinates) loosely within Uttarakhand, India, for a plausible
map center — same disclaimer as MASTER_SPEC.md and DEMO_DISCLAIMER. All
seeded records are marked is_simulated=True.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.assets import Bridge, Hospital, ResponseResource, RoadSegment, Settlement, Shelter
from app.models.events import DisasterEvent
from app.models.scenario import Scenario

DEMO_SCENARIO_ID = "uttarakhand-flashflood-demo"

_now = lambda: datetime.now(timezone.utc)  # noqa: E731


def seed_demo_scenario(db: Session) -> Scenario:
    existing = db.get(Scenario, DEMO_SCENARIO_ID)
    if existing:
        return existing

    now = _now()
    scenario = Scenario(
        id=DEMO_SCENARIO_ID,
        name="Uttarakhand Flash-Flood Vertical Slice",
        district="Uttarakhand",
        phase="idle",
        clock_seconds=0,
        is_simulated=True,
    )
    db.add(scenario)

    settlements = [
        Settlement(
            id="alpha", name="Village Alpha", district="Uttarakhand", state="Uttarakhand",
            population=1450, vulnerable_population=220, lat=30.045, lon=78.38,
            risk_metadata="Near river corridor; fictional prototype placement.",
            source="simulated", observed_at=now, confidence=0.6, is_simulated=True,
        ),
        Settlement(
            id="beta", name="Village Beta", district="Uttarakhand", state="Uttarakhand",
            population=980, vulnerable_population=140, lat=30.010, lon=78.41,
            risk_metadata="Downstream of Bridge-3; fictional prototype placement.",
            source="simulated", observed_at=now, confidence=0.6, is_simulated=True,
        ),
        Settlement(
            id="gamma", name="Village Gamma", district="Uttarakhand", state="Uttarakhand",
            population=640, vulnerable_population=95, lat=30.070, lon=78.47,
            risk_metadata="Hill road exposure; fictional prototype placement.",
            source="simulated", observed_at=now, confidence=0.6, is_simulated=True,
        ),
        Settlement(
            id="delta", name="Village Delta", district="Uttarakhand", state="Uttarakhand",
            population=510, vulnerable_population=60, lat=30.095, lon=78.52,
            risk_metadata="Lower exposure, fictional prototype placement.",
            source="simulated", observed_at=now, confidence=0.6, is_simulated=True,
        ),
    ]
    db.add_all(settlements)

    bridge3 = Bridge(
        id="bridge-3", name="Bridge-3", status="open", lat=30.028, lon=78.40,
        dependent_route_ids='["main-alpha-a", "main-beta-a"]',
        source="simulated", observed_at=now, confidence=0.65, is_simulated=True,
    )
    db.add(bridge3)

    roads = [
        RoadSegment(
            id="main-alpha-a", name="Main Road (Alpha -> Bridge-3 -> Shelter A)",
            geometry_geojson='{"type":"LineString","coordinates":[[78.38,30.045],[78.40,30.028],[78.46,30.10]]}',
            status="open", depends_on_bridge_id="bridge-3",
            source="simulated", observed_at=now, confidence=0.65, is_simulated=True,
        ),
        RoadSegment(
            id="secondary-alpha-b", name="Secondary Road (Alpha -> Shelter B, longer)",
            geometry_geojson='{"type":"LineString","coordinates":[[78.38,30.045],[78.43,30.00],[78.50,29.98]]}',
            status="open", depends_on_bridge_id=None,
            source="simulated", observed_at=now, confidence=0.6, is_simulated=True,
        ),
        RoadSegment(
            id="main-beta-a", name="Main Road (Beta -> Bridge-3 -> Shelter A)",
            geometry_geojson='{"type":"LineString","coordinates":[[78.41,30.010],[78.40,30.028],[78.46,30.10]]}',
            status="open", depends_on_bridge_id="bridge-3",
            source="simulated", observed_at=now, confidence=0.65, is_simulated=True,
        ),
        RoadSegment(
            id="hospital-link", name="Hospital Access Road",
            geometry_geojson='{"type":"LineString","coordinates":[[78.41,30.010],[78.36,30.005]]}',
            status="open", depends_on_bridge_id=None,
            source="simulated", observed_at=now, confidence=0.65, is_simulated=True,
        ),
    ]
    db.add_all(roads)

    shelters = [
        Shelter(
            id="shelter-a", name="Shelter A — Govt School", capacity=1600, occupied=0,
            operational_status="operational", accessibility="Road access via Bridge-3",
            lat=30.10, lon=78.46, source="simulated", observed_at=now,
            last_verified_at=now - timedelta(days=1), confidence=0.7, is_simulated=True,
        ),
        Shelter(
            id="shelter-b", name="Shelter B — Hill Camp", capacity=900, occupied=0,
            operational_status="limited", accessibility="Secondary road only",
            lat=29.98, lon=78.50, source="simulated", observed_at=now,
            last_verified_at=now - timedelta(days=6), confidence=0.5, is_simulated=True,
        ),
    ]
    db.add_all(shelters)

    hospital = Hospital(
        id="hospital", name="District Hospital", emergency_beds=40, available_beds=28,
        operational_status="operational", lat=30.005, lon=78.36,
        source="simulated", observed_at=now, confidence=0.7, is_simulated=True,
    )
    db.add(hospital)

    resources = [
        ResponseResource(
            id="r1", type="rescue_team", agency="SDRF", quantity=1, availability="available",
            status="ready", lat=30.0, lon=78.34, source="simulated", observed_at=now,
            confidence=0.7, is_simulated=True,
        ),
        ResponseResource(
            id="r2", type="rescue_team", agency="SDRF", quantity=1, availability="available",
            status="ready", lat=30.06, lon=78.48, source="simulated", observed_at=now,
            confidence=0.7, is_simulated=True,
        ),
        ResponseResource(
            id="ambulances", type="ambulance", agency="Health", quantity=4, availability="available",
            status="ready", lat=30.005, lon=78.36, source="simulated", observed_at=now,
            confidence=0.7, is_simulated=True,
        ),
        ResponseResource(
            id="buses", type="bus", agency="Transport", quantity=2, availability="short",
            status="partial", lat=30.02, lon=78.40, source="simulated", observed_at=now,
            confidence=0.5, is_simulated=True,
        ),
        ResponseResource(
            id="generators", type="generator", agency="PWD", quantity=6, availability="available",
            status="ready", lat=30.02, lon=78.40, source="simulated", observed_at=now,
            confidence=0.7, is_simulated=True,
        ),
    ]
    db.add_all(resources)

    alert = DisasterEvent(
        source="imd.gov.in", source_event_id="IMD-UK-2026-0091", lifecycle="new",
        hazard_type="extreme_rainfall", severity="extreme", certainty="likely",
        headline="Extreme Rainfall Warning for Uttarakhand district",
        description="Seeded demo alert simulating an IMD-style extreme rainfall warning for the flash-flood vertical slice.",
        issued_at=now, effective_from=now, expires_at=now + timedelta(hours=48),
        affected_area="Uttarakhand district river corridor villages",
        confidence=0.75, is_simulated=True, received_at=now,
    )
    db.add(alert)

    bridge_failure_event = DisasterEvent(
        source="pwd.uk.gov.in", source_event_id="PWD-UK-2026-BRIDGE3-FAIL", lifecycle="new",
        hazard_type="generic", severity="severe", certainty="observed",
        headline="Bridge-3 structural failure reported (infrastructure event)",
        description="Seeded infrastructure-failure demo event, dormant until the frontend triggers the bridge-failure replan sequence.",
        issued_at=now, effective_from=now, expires_at=now + timedelta(hours=24),
        affected_area="Bridge-3 crossing",
        confidence=0.6, is_simulated=True, received_at=now,
    )
    db.add(bridge_failure_event)

    db.commit()
    db.refresh(scenario)
    return scenario
