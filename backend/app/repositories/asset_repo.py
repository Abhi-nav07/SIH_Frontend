from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assets import Bridge, Hospital, ResponseResource, RoadSegment, Settlement, Shelter, VerificationRecord
from app.services.conflict_service import resolve_status_update, serialize_conflicts

_ASSET_MODELS = {
    "road_segment": RoadSegment,
    "bridge": Bridge,
}


def list_settlements(db: Session) -> list[Settlement]:
    return list(db.execute(select(Settlement)).scalars().all())


def list_roads(db: Session) -> list[RoadSegment]:
    return list(db.execute(select(RoadSegment)).scalars().all())


def list_bridges(db: Session) -> list[Bridge]:
    return list(db.execute(select(Bridge)).scalars().all())


def list_shelters(db: Session) -> list[Shelter]:
    return list(db.execute(select(Shelter)).scalars().all())


def list_hospitals(db: Session) -> list[Hospital]:
    return list(db.execute(select(Hospital)).scalars().all())


def list_resources(db: Session) -> list[ResponseResource]:
    return list(db.execute(select(ResponseResource)).scalars().all())


def get_status_asset(db: Session, asset_type: str, asset_id: str):
    model = _ASSET_MODELS.get(asset_type)
    if model is None:
        return None
    return db.get(model, asset_id)


def apply_status_update(
    db: Session,
    *,
    asset_type: str,
    asset_id: str,
    incoming_status: str,
    incoming_source: str,
    incoming_observed_at: datetime,
    manual_override: bool = False,
    verified_by: str | None = None,
    notes: str | None = None,
):
    """Apply an incoming status observation through conflict resolution
    (V0.3 spec items 8 + 15), persist it, and log a verification record when
    it's a manual field verification."""
    asset = get_status_asset(db, asset_type, asset_id)
    if asset is None:
        return None

    resolution = resolve_status_update(
        current_status=asset.status,
        current_source=asset.source,
        current_observed_at=asset.observed_at.isoformat() if asset.observed_at else None,
        incoming_status=incoming_status,
        incoming_source=incoming_source,
        incoming_observed_at=incoming_observed_at.isoformat(),
        manual_override=manual_override,
    )

    asset.status = resolution.status
    asset.conflicting_sources = serialize_conflicts(resolution.conflicting_sources)
    asset.source = incoming_source
    asset.observed_at = incoming_observed_at
    asset.confidence = 0.95 if manual_override else (0.25 if resolution.has_conflict else 0.7)
    asset.is_simulated = False if manual_override else asset.is_simulated

    if manual_override:
        asset.last_verified_at = incoming_observed_at
        asset.verified_by = verified_by
        db.add(
            VerificationRecord(
                asset_type=asset_type,
                asset_id=asset_id,
                status=incoming_status,
                verified_by=verified_by or "unknown",
                observed_at=incoming_observed_at,
                notes=notes,
            )
        )

    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset, resolution.has_conflict
