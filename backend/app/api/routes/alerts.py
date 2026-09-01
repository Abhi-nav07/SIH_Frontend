from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.adapters.cap_adapter import CapAdapterError, parse_cap_alert
from app.api.deps import get_db
from app.repositories import event_repo
from app.schemas.events import DisasterEventOut

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


def _to_out(row) -> DisasterEventOut:
    from app.services.snapshot_service import event_out  # local import avoids a cycle

    return event_out(row, datetime.now(timezone.utc))


@router.get("", response_model=list[DisasterEventOut])
def list_alerts(active_only: bool = False, db: Session = Depends(get_db)):
    rows = event_repo.list_events(db, active_only=active_only)
    return [_to_out(r) for r in rows]


@router.post("/ingest/cap", response_model=DisasterEventOut)
def ingest_cap_alert(raw: dict, db: Session = Depends(get_db)):
    """Ingest one CAP-like alert payload (see app/fixtures/*.json for shape)."""
    try:
        event_in = parse_cap_alert(raw)
    except CapAdapterError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    row = event_repo.create_event(db, event_in)
    return _to_out(row)


@router.get("/{event_id}", response_model=DisasterEventOut)
def get_alert(event_id: int, db: Session = Depends(get_db)):
    row = event_repo.get_event(db, event_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _to_out(row)
