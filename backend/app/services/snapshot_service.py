from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.scenario import Scenario, ScenarioSnapshot
from app.repositories import asset_repo, event_repo
from app.schemas.assets import (
    BridgeOut,
    HospitalOut,
    ResponseResourceOut,
    RoadSegmentOut,
    SettlementOut,
    ShelterOut,
)
from app.schemas.common import ConfidenceInfo, FreshnessInfo, Provenance, to_point_geojson
from app.schemas.events import DisasterEventOut
from app.schemas.scenario import ScenarioOut, ScenarioState
from app.services.confidence_service import compute_confidence
from app.services.conflict_service import deserialize_conflicts
from app.services.freshness_service import (
    alert_lifecycle_status,
    bridge_freshness,
    default_freshness,
    road_freshness,
    shelter_freshness,
)


def _provenance(row) -> Provenance:
    return Provenance(
        source=row.source,
        source_id=getattr(row, "source_id", None),
        observed_at=row.observed_at,
        received_at=row.received_at,
        last_verified_at=row.last_verified_at,
        verified_by=row.verified_by,
        is_simulated=row.is_simulated,
    )


def road_out(row, settings: Settings, now: datetime) -> RoadSegmentOut:
    fresh = road_freshness(row.observed_at, settings, now)
    conf = compute_confidence(
        source_reliability=0.7,
        freshness=fresh,
        manually_verified=row.last_verified_at is not None,
        has_conflict=row.status == "conflict",
        settings=settings,
    )
    return RoadSegmentOut(
        id=row.id, name=row.name, status=row.status,
        conflicting_sources=deserialize_conflicts(row.conflicting_sources),
        depends_on_bridge_id=row.depends_on_bridge_id,
        provenance=_provenance(row),
        freshness=FreshnessInfo(status=fresh.value),
        confidence=ConfidenceInfo(score=conf.score, reason=conf.reason),
    )


def bridge_out(row, settings: Settings, now: datetime) -> BridgeOut:
    fresh = bridge_freshness(row.observed_at, settings, now)
    conf = compute_confidence(
        source_reliability=0.75,
        freshness=fresh,
        manually_verified=row.last_verified_at is not None,
        has_conflict=row.status == "conflict",
        settings=settings,
    )
    dep_ids = json.loads(row.dependent_route_ids) if row.dependent_route_ids else []
    return BridgeOut(
        id=row.id, name=row.name, status=row.status, location=to_point_geojson(row.lat, row.lon),
        conflicting_sources=deserialize_conflicts(row.conflicting_sources),
        dependent_route_ids=dep_ids,
        provenance=_provenance(row),
        freshness=FreshnessInfo(status=fresh.value),
        confidence=ConfidenceInfo(score=conf.score, reason=conf.reason),
    )


def shelter_out(row, settings: Settings, now: datetime) -> ShelterOut:
    fresh = shelter_freshness(row.last_verified_at or row.observed_at, settings, now)
    return ShelterOut(
        id=row.id, name=row.name, capacity=row.capacity, occupied=row.occupied,
        operational_status=row.operational_status, accessibility=row.accessibility,
        location=to_point_geojson(row.lat, row.lon),
        provenance=_provenance(row),
        freshness=FreshnessInfo(status=fresh.value),
    )


def hospital_out(row, settings: Settings, now: datetime) -> HospitalOut:
    fresh = default_freshness(row.observed_at, settings, now)
    return HospitalOut(
        id=row.id, name=row.name, emergency_beds=row.emergency_beds, available_beds=row.available_beds,
        operational_status=row.operational_status, location=to_point_geojson(row.lat, row.lon),
        provenance=_provenance(row),
        freshness=FreshnessInfo(status=fresh.value),
    )


def resource_out(row, settings: Settings, now: datetime) -> ResponseResourceOut:
    fresh = default_freshness(row.observed_at, settings, now)
    return ResponseResourceOut(
        id=row.id, type=row.type, agency=row.agency, quantity=row.quantity,
        availability=row.availability, status=row.status, location=to_point_geojson(row.lat, row.lon),
        provenance=_provenance(row),
        freshness=FreshnessInfo(status=fresh.value),
    )


def settlement_out(row) -> SettlementOut:
    return SettlementOut(
        id=row.id, name=row.name, district=row.district, state=row.state,
        population=row.population, vulnerable_population=row.vulnerable_population,
        location=to_point_geojson(row.lat, row.lon), provenance=_provenance(row),
    )


def event_out(row, now: datetime) -> DisasterEventOut:
    status = alert_lifecycle_status(row.effective_from, row.expires_at, row.lifecycle == "cancel", now)
    return DisasterEventOut(
        id=row.id, source_event_id=row.source_event_id, lifecycle=row.lifecycle,
        hazard_type=row.hazard_type, severity=row.severity, certainty=row.certainty,
        headline=row.headline, description=row.description,
        issued_at=row.issued_at, effective_from=row.effective_from, expires_at=row.expires_at,
        affected_area=row.affected_area, supersedes_id=row.supersedes_id,
        lifecycle_status=status, provenance=_provenance(row),
    )


def build_scenario_state(db: Session, scenario: Scenario) -> ScenarioState:
    settings = get_settings()
    now = datetime.now(timezone.utc)

    events = event_repo.list_events(db)
    active_alerts = [
        event_out(e, now) for e in events
        if alert_lifecycle_status(e.effective_from, e.expires_at, e.lifecycle == "cancel", now) == "active"
    ]

    return ScenarioState(
        scenario=ScenarioOut.model_validate(scenario),
        active_alerts=active_alerts,
        settlements=[settlement_out(s) for s in asset_repo.list_settlements(db)],
        roads=[road_out(r, settings, now) for r in asset_repo.list_roads(db)],
        bridges=[bridge_out(b, settings, now) for b in asset_repo.list_bridges(db)],
        shelters=[shelter_out(s, settings, now) for s in asset_repo.list_shelters(db)],
        hospitals=[hospital_out(h, settings, now) for h in asset_repo.list_hospitals(db)],
        resources=[resource_out(r, settings, now) for r in asset_repo.list_resources(db)],
        generated_at=now,
    )


def create_snapshot(db: Session, scenario: Scenario, reason: str) -> ScenarioSnapshot:
    state = build_scenario_state(db, scenario)
    snapshot = ScenarioSnapshot(
        scenario_id=scenario.id,
        reason=reason,
        state_json=state.model_dump_json(),
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def list_snapshots(db: Session, scenario_id: str) -> list[ScenarioSnapshot]:
    stmt = (
        select(ScenarioSnapshot)
        .where(ScenarioSnapshot.scenario_id == scenario_id)
        .order_by(ScenarioSnapshot.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get_snapshot(db: Session, scenario_id: str, snapshot_id: int) -> ScenarioSnapshot | None:
    snap = db.get(ScenarioSnapshot, snapshot_id)
    if snap is None or snap.scenario_id != scenario_id:
        return None
    return snap


def snapshot_state(snapshot: ScenarioSnapshot) -> ScenarioState:
    return ScenarioState.model_validate(json.loads(snapshot.state_json))
