from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.repositories import asset_repo
from app.schemas.assets import BridgeOut, RoadSegmentOut, VerifyAssetRequest, VerifyAssetResponse
from app.schemas.common import ConfidenceInfo
from app.services.confidence_service import compute_confidence
from app.services.freshness_service import bridge_freshness, road_freshness
from app.services.snapshot_service import bridge_out, road_out

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

_ASSET_TYPES = {"road_segment", "bridge"}


@router.get("")
def list_assets(db: Session = Depends(get_db)) -> dict[str, list[RoadSegmentOut | BridgeOut]]:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return {
        "road_segments": [road_out(r, settings, now) for r in asset_repo.list_roads(db)],
        "bridges": [bridge_out(b, settings, now) for b in asset_repo.list_bridges(db)],
    }


@router.get("/{asset_id}")
def get_asset(asset_id: str, asset_type: str, db: Session = Depends(get_db)):
    if asset_type not in _ASSET_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown asset_type '{asset_type}'. Must be one of {_ASSET_TYPES}.")
    asset = asset_repo.get_status_asset(db, asset_type, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return road_out(asset, settings, now) if asset_type == "road_segment" else bridge_out(asset, settings, now)


@router.post("/{asset_id}/verify", response_model=VerifyAssetResponse)
def verify_asset(
    asset_id: str,
    asset_type: str,
    body: VerifyAssetRequest,
    db: Session = Depends(get_db),
):
    """Manual field verification (V0.3 spec item 15).

    Manual verification always supersedes stale automated data — see
    app/services/conflict_service.py:resolve_status_update for the
    documented precedence rule.
    """
    if asset_type not in _ASSET_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown asset_type '{asset_type}'. Must be one of {_ASSET_TYPES}.")

    try:
        observed_at = datetime.fromisoformat(body.observed_at)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"observed_at must be ISO-8601: {exc}") from exc

    result = asset_repo.apply_status_update(
        db,
        asset_type=asset_type,
        asset_id=asset_id,
        incoming_status=body.status,
        incoming_source=f"field:{body.verified_by}",
        incoming_observed_at=observed_at,
        manual_override=True,
        verified_by=body.verified_by,
        notes=body.notes,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset, had_conflict_before = result

    settings = get_settings()
    now = datetime.now(timezone.utc)
    fresh = bridge_freshness(asset.observed_at, settings, now) if asset_type == "bridge" else road_freshness(
        asset.observed_at, settings, now
    )
    conf = compute_confidence(
        source_reliability=0.9,
        freshness=fresh,
        manually_verified=True,
        has_conflict=False,
        settings=settings,
    )

    return VerifyAssetResponse(
        asset_type=asset_type,
        asset_id=asset_id,
        status=asset.status,
        verified_by=body.verified_by,
        superseded_conflict=had_conflict_before,
        confidence=ConfidenceInfo(score=conf.score, reason=conf.reason),
    )
