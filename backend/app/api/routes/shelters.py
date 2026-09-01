from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.repositories import asset_repo
from app.schemas.assets import ShelterOut
from app.services.snapshot_service import shelter_out

router = APIRouter(prefix="/api/v1/shelters", tags=["shelters"])


@router.get("", response_model=list[ShelterOut])
def list_shelters(db: Session = Depends(get_db)):
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return [shelter_out(s, settings, now) for s in asset_repo.list_shelters(db)]
