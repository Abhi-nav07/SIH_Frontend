"""
Data-gap and low-confidence detection (V0.4 prompt §15-16).

The copilot/decision engine must never present stale or missing data as
certainty. This module inspects a ScenarioSnapshot and surfaces explicit
gaps that downstream consumers (recommendations, copilot, brief) must
attach to their output.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.outputs import DataGap
from app.schemas.scenario import ScenarioSnapshot

STALE_HOURS_THRESHOLD = 6.0
LOW_CONFIDENCE_THRESHOLD = 0.5


def _age_hours(observed_at, now: datetime) -> float | None:
    if observed_at is None:
        return None
    if observed_at.tzinfo is None:
        observed_at = observed_at.replace(tzinfo=timezone.utc)
    return (now - observed_at).total_seconds() / 3600.0


def detect_data_gaps(snapshot: ScenarioSnapshot, now: datetime | None = None) -> list[DataGap]:
    now = now or datetime.now(timezone.utc)
    gaps: list[DataGap] = []

    for road in snapshot.roads:
        prov = road.provenance
        age = _age_hours(prov.observed_at, now)
        if prov.observed_at is None:
            gaps.append(DataGap(subject=road.id, description=f"Road '{road.label}' has no verification timestamp."))
        elif age is not None and age > STALE_HOURS_THRESHOLD:
            gaps.append(
                DataGap(subject=road.id, description=f"Road '{road.label}' last verified {age:.0f} hours ago (stale).")
            )
        if prov.confidence < LOW_CONFIDENCE_THRESHOLD:
            gaps.append(
                DataGap(
                    subject=road.id,
                    description=f"Road '{road.label}' status confidence only {prov.confidence * 100:.0f}%.",
                )
            )

    for shelter in snapshot.shelters:
        prov = shelter.provenance
        age = _age_hours(prov.observed_at, now)
        if prov.observed_at is None:
            gaps.append(DataGap(subject=shelter.id, description=f"Shelter '{shelter.name}' accessibility not verified."))
        elif age is not None and age > STALE_HOURS_THRESHOLD:
            gaps.append(
                DataGap(subject=shelter.id, description=f"Shelter '{shelter.name}' verified {age:.0f} hours ago (stale).")
            )

    for res in snapshot.resources:
        if res.kind == "ambulance" and not res.eta_minutes_by_settlement:
            gaps.append(DataGap(subject=res.id, description=f"No current availability/ETA data received for {res.name}."))

    if not snapshot.resources:
        gaps.append(DataGap(subject="resources", description="No resource/asset data present in scenario snapshot."))

    return gaps


def overall_confidence(snapshot: ScenarioSnapshot) -> float:
    """Simple aggregate confidence across provenance-bearing facts."""
    confidences = []
    for road in snapshot.roads:
        confidences.append(road.provenance.confidence)
    for shelter in snapshot.shelters:
        confidences.append(shelter.provenance.confidence)
    for settlement in snapshot.settlements:
        confidences.append(settlement.provenance.confidence)
    if not confidences:
        return 0.5
    return round(sum(confidences) / len(confidences), 2)
