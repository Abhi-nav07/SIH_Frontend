from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.repositories import asset_repo
from app.schemas.assets import ResponseResourceOut
from app.services.snapshot_service import resource_out

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])


@router.get("", response_model=list[ResponseResourceOut])
def list_resources(db: Session = Depends(get_db)):
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return [resource_out(r, settings, now) for r in asset_repo.list_resources(db)]
