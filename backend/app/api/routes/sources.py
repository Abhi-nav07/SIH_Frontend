from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.source import Source

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("")
def list_sources(db: Session = Depends(get_db)):
    rows = db.execute(select(Source)).scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "agency": s.agency,
            "adapter_type": s.adapter_type,
            "base_url": s.base_url,
            "enabled": s.enabled,
            "polling_interval_seconds": s.polling_interval_seconds,
            "authentication_type": s.authentication_type,
            "reliability_score": s.reliability_score,
            "last_success": s.last_success,
            "last_error": s.last_error,
        }
        for s in rows
    ]
