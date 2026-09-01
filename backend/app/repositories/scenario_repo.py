from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scenario import Scenario


def get_scenario(db: Session, scenario_id: str) -> Scenario | None:
    return db.get(Scenario, scenario_id)


def list_scenarios(db: Session) -> list[Scenario]:
    return list(db.execute(select(Scenario)).scalars().all())


def create_scenario(db: Session, *, id: str, name: str, district: str) -> Scenario:
    scenario = Scenario(id=id, name=name, district=district, phase="idle", clock_seconds=0, is_simulated=True)
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


def start_scenario(db: Session, scenario: Scenario) -> Scenario:
    scenario.phase = "active"
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario
