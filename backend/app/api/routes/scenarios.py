import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories import scenario_repo
from app.schemas.scenario import (
    ScenarioCreate,
    ScenarioEventIn,
    ScenarioOut,
    ScenarioSnapshotDetailOut,
    ScenarioSnapshotOut,
    ScenarioState,
)
from app.services import snapshot_service
from app.services.stream_service import StreamEventKind, event_bus

router = APIRouter(prefix="/api/v1/scenarios", tags=["scenarios"])

_EVENT_KIND_MAP = {
    "BRIDGE_STATUS_CHANGED": StreamEventKind.BRIDGE_STATUS_CHANGED,
    "ROAD_BLOCKED": StreamEventKind.ROAD_BLOCKED,
    "SHELTER_CAPACITY_CHANGED": StreamEventKind.SHELTER_CAPACITY_CHANGED,
    "RESOURCE_STATUS_CHANGED": StreamEventKind.RESOURCE_STATUS_CHANGED,
    "ALERT_RECEIVED": StreamEventKind.ALERT_RECEIVED,
    "ALERT_UPDATED": StreamEventKind.ALERT_UPDATED,
}


@router.get("", response_model=list[ScenarioOut])
def list_scenarios(db: Session = Depends(get_db)):
    return scenario_repo.list_scenarios(db)


@router.post("", response_model=ScenarioOut)
def create_scenario(body: ScenarioCreate, db: Session = Depends(get_db)):
    if scenario_repo.get_scenario(db, body.id):
        raise HTTPException(status_code=409, detail=f"Scenario '{body.id}' already exists")
    return scenario_repo.create_scenario(db, id=body.id, name=body.name, district=body.district)


@router.get("/{scenario_id}", response_model=ScenarioOut)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = scenario_repo.get_scenario(db, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("/{scenario_id}/start", response_model=ScenarioState)
async def start_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = scenario_repo.get_scenario(db, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    scenario = scenario_repo.start_scenario(db, scenario)
    snapshot_service.create_snapshot(db, scenario, reason="scenario_start")
    await event_bus.publish(scenario_id, StreamEventKind.ALERT_RECEIVED, {"scenario_id": scenario_id})
    return snapshot_service.build_scenario_state(db, scenario)


@router.get("/{scenario_id}/state", response_model=ScenarioState)
def get_scenario_state(scenario_id: str, db: Session = Depends(get_db)):
    scenario = scenario_repo.get_scenario(db, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return snapshot_service.build_scenario_state(db, scenario)


@router.post("/{scenario_id}/events")
async def post_scenario_event(scenario_id: str, body: ScenarioEventIn, db: Session = Depends(get_db)):
    """Record a field/infrastructure change and emit it on the realtime
    stream. This does NOT run the frontend's replan logic (that stays in
    lib/scenario/store.ts per the merge-safety rule) — it's the ingestion
    side the API contract needs so ApiScenarioProvider has somewhere to push
    field-reported changes."""
    scenario = scenario_repo.get_scenario(db, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    kind = _EVENT_KIND_MAP.get(body.kind)
    if kind is None:
        raise HTTPException(status_code=422, detail=f"Unknown event kind '{body.kind}'. Must be one of {list(_EVENT_KIND_MAP)}.")

    snapshot_service.create_snapshot(db, scenario, reason="infrastructure_change")
    await event_bus.publish(scenario_id, kind, {"asset_id": body.asset_id, "source": body.source, **body.payload})
    return {"accepted": True, "kind": body.kind}


@router.get("/{scenario_id}/snapshots", response_model=list[ScenarioSnapshotOut])
def list_snapshots(scenario_id: str, db: Session = Depends(get_db)):
    if scenario_repo.get_scenario(db, scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return snapshot_service.list_snapshots(db, scenario_id)


@router.get("/{scenario_id}/snapshots/{snapshot_id}", response_model=ScenarioSnapshotDetailOut)
def get_snapshot(scenario_id: str, snapshot_id: int, db: Session = Depends(get_db)):
    snap = snapshot_service.get_snapshot(db, scenario_id, snapshot_id)
    if snap is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return ScenarioSnapshotDetailOut(
        id=snap.id,
        scenario_id=snap.scenario_id,
        reason=snap.reason,
        created_at=snap.created_at,
        state=snapshot_service.snapshot_state(snap),
    )


@router.get("/{scenario_id}/stream")
async def stream_scenario_events(scenario_id: str, db: Session = Depends(get_db)):
    if scenario_repo.get_scenario(db, scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    queue = event_bus.subscribe(scenario_id)

    async def event_generator():
        try:
            yield {"event": "connected", "data": json.dumps({"scenario_id": scenario_id, "at": datetime.now(timezone.utc).isoformat()})}
            while True:
                message = await queue.get()
                yield {"event": "scenario_update", "data": message}
        except asyncio.CancelledError:
            event_bus.unsubscribe(scenario_id, queue)
            raise

    return EventSourceResponse(event_generator())
