from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings
from app.repositories import asset_repo
from app.schemas.assets import HospitalOut
from app.services.snapshot_service import hospital_out

router = APIRouter(prefix="/api/v1/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalOut])
def list_hospitals(db: Session = Depends(get_db)):
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return [hospital_out(h, settings, now) for h in asset_repo.list_hospitals(db)]
