from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import alerts, assets, health, hospitals, resources, scenarios, shelters, sources
from app.core.db import SessionLocal, init_db
from app.services.seed_service import seed_demo_scenario


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev/test convenience only — production uses Alembic migrations
    # (see /backend/alembic) instead of create_all.
    init_db()
    db = SessionLocal()
    try:
        seed_demo_scenario(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="SANKAT-SETU Data Backbone",
    description=(
        "Alert-to-Action Disaster Orchestration Engine — backend data/integration layer (V0.3). "
        "Auditable, provenance-tracked operational state behind the existing frontend."
    ),
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sources.router)
app.include_router(alerts.router)
app.include_router(scenarios.router)
app.include_router(assets.router)
app.include_router(shelters.router)
app.include_router(hospitals.router)
app.include_router(resources.router)
