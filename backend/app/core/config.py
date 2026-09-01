"""Central app configuration.

SQLite is the default so the backend runs with zero external dependencies
during development/testing (per MASTER_SPEC / V0.3 prompt fallback clause).
Production should point DATABASE_URL at a PostGIS-enabled Postgres instance;
models are written to be PostGIS-ready (see app/models) even though the
SQLite dev path stores geometry as plain lon/lat floats instead of a real
geometry column.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "development"
    database_url: str = "sqlite:///./sankatsetu.db"

    # Freshness thresholds (hours unless noted). Centralized here per the
    # V0.3 requirement: "Do not hardcode thresholds inside UI."
    road_status_stale_hours: float = 6.0
    road_status_expired_hours: float = 24.0
    shelter_verification_stale_days: float = 3.0
    shelter_verification_expired_days: float = 14.0
    bridge_verification_stale_hours: float = 6.0
    bridge_verification_expired_hours: float = 24.0
    default_stale_hours: float = 12.0
    default_expired_hours: float = 48.0

    # Confidence score weights (deterministic, explainable — see
    # app/services/confidence_service.py). Must sum to 1.0.
    confidence_weight_source_reliability: float = 0.30
    confidence_weight_freshness: float = 0.30
    confidence_weight_manual_verification: float = 0.25
    confidence_weight_source_agreement: float = 0.15


@lru_cache
def get_settings() -> Settings:
    return Settings()
