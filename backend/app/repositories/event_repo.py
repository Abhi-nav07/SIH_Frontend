from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.events import DisasterEvent
from app.schemas.events import DisasterEventIn


def create_event(db: Session, event_in: DisasterEventIn) -> DisasterEvent:
    """Persist one canonical event, wiring up lifecycle supersession.

    - "update" and "cancel" lifecycle events are linked via supersedes_id to
      the most recent prior event sharing the same source_event_id, so the
      full history stays queryable instead of being overwritten in place.
    """
    prior = latest_event_for_source_id(db, event_in.source, event_in.source_event_id)

    row = DisasterEvent(
        source=event_in.source,
        source_event_id=event_in.source_event_id,
        lifecycle=event_in.lifecycle,
        hazard_type=event_in.hazard_type,
        severity=event_in.severity,
        certainty=event_in.certainty,
        headline=event_in.headline,
        description=event_in.description,
        issued_at=event_in.issued_at,
        effective_from=event_in.effective_from,
        expires_at=event_in.expires_at,
        geometry_geojson=event_in.geometry_geojson,
        affected_area=event_in.affected_area,
        metadata_json=event_in.metadata_json,
        is_simulated=event_in.is_simulated,
        confidence=event_in.confidence,
        supersedes_id=prior.id if prior and event_in.lifecycle in ("update", "cancel") else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def latest_event_for_source_id(db: Session, source: str, source_event_id: str) -> DisasterEvent | None:
    stmt = (
        select(DisasterEvent)
        .where(DisasterEvent.source == source, DisasterEvent.source_event_id == source_event_id)
        .order_by(DisasterEvent.created_at.desc())
    )
    return db.execute(stmt).scalars().first()


def list_events(db: Session, active_only: bool = False) -> list[DisasterEvent]:
    stmt = select(DisasterEvent).order_by(DisasterEvent.created_at.desc())
    rows = list(db.execute(stmt).scalars().all())
    if not active_only:
        return rows
    return [r for r in rows if r.lifecycle != "cancel"]


def get_event(db: Session, event_id: int) -> DisasterEvent | None:
    return db.get(DisasterEvent, event_id)
