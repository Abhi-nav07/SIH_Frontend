import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import db as db_module
from app.main import app


@pytest.fixture()
def test_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.models import assets, events, scenario, source  # noqa: F401

    db_module.Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture()
def db_session(test_engine):
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, future=True)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(test_engine, monkeypatch):
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, future=True)

    def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[db_module.get_db] = _override_get_db

    # Seed the demo scenario once, directly, instead of relying on the app's
    # startup lifespan (which points at the real DATABASE_URL, not this
    # in-memory test engine).
    from app.services.seed_service import seed_demo_scenario

    session = TestingSessionLocal()
    try:
        seed_demo_scenario(session)
    finally:
        session.close()

    # Not using `with TestClient(app)` deliberately: that would trigger the
    # app's real lifespan (init_db/seed against the configured
    # DATABASE_URL), which we don't want touching a real sqlite file during
    # tests. Routes are already fully served via the dependency override
    # above against the in-memory engine seeded a few lines up.
    test_client = TestClient(app)
    yield test_client

    app.dependency_overrides.clear()
