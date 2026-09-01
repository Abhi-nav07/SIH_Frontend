"""Data conflict handling (V0.3 spec item 8).

When two sources disagree on an asset's status, we never silently pick one.
Callers should route new observations through `resolve_status_update`, which
either accepts the update cleanly or returns a CONFLICT result the caller
must persist and surface via the API (status="CONFLICT", confidence lowered,
conflicting_sources populated) rather than overwriting silently.
"""

from __future__ import annotations

import json
from dataclasses import dataclass


@dataclass(frozen=True)
class ConflictResolution:
    status: str
    conflicting_sources: list[dict] | None
    has_conflict: bool


def resolve_status_update(
    *,
    current_status: str,
    current_source: str,
    current_observed_at: str | None,
    incoming_status: str,
    incoming_source: str,
    incoming_observed_at: str | None,
    manual_override: bool = False,
) -> ConflictResolution:
    """Decide whether an incoming observation can update an asset cleanly.

    - A manual field verification always supersedes automated data
      (documented rule per V0.3 spec item 15) and clears any prior conflict.
    - Otherwise, if the incoming status disagrees with the current status
      AND the current status did not itself come from the same source,
      we flag a conflict instead of overwriting.
    - Agreeing updates (or updates from the same source correcting itself)
      pass through cleanly.
    """
    if manual_override:
        return ConflictResolution(status=incoming_status, conflicting_sources=None, has_conflict=False)

    if current_status == "conflict":
        # Already conflicted — a new disagreeing source just adds evidence;
        # a new agreeing source doesn't clear it alone (only manual
        # verification does, per the rule above).
        return ConflictResolution(
            status="conflict",
            conflicting_sources=[
                {"source": current_source, "status": current_status, "observed_at": current_observed_at},
                {"source": incoming_source, "status": incoming_status, "observed_at": incoming_observed_at},
            ],
            has_conflict=True,
        )

    if incoming_status == current_status or incoming_source == current_source:
        return ConflictResolution(status=incoming_status, conflicting_sources=None, has_conflict=False)

    # Different source, different status → genuine conflict.
    return ConflictResolution(
        status="conflict",
        conflicting_sources=[
            {"source": current_source, "status": current_status, "observed_at": current_observed_at},
            {"source": incoming_source, "status": incoming_status, "observed_at": incoming_observed_at},
        ],
        has_conflict=True,
    )


def serialize_conflicts(conflicts: list[dict] | None) -> str | None:
    return json.dumps(conflicts) if conflicts else None


def deserialize_conflicts(raw: str | None) -> list[dict] | None:
    return json.loads(raw) if raw else None
