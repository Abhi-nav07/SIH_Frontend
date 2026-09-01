"""CAP-style alert adapter (V0.3 spec item 3).

Converts a CAP-like structured alert (the Common Alerting Protocol shape
used by IMD/NDEM-style feeds) into the canonical DisasterEventIn schema.

We are NOT claiming direct official production integration — this parses
the CAP JSON *shape*, sourced from local fixtures/tests only, per the
"Do not scrape websites in production code. Use fixtures or documented
feeds only." constraint in the V0.3 prompt.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from app.schemas.events import DisasterEventIn

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"

_CAP_SEVERITY_MAP = {
    "Extreme": "extreme",
    "Severe": "severe",
    "Moderate": "moderate",
    "Minor": "minor",
}

_CAP_CERTAINTY_MAP = {
    "Observed": "observed",
    "Likely": "likely",
    "Possible": "possible",
    "Unknown": "unknown",
}

_CAP_MSGTYPE_TO_LIFECYCLE = {
    "Alert": "new",
    "Update": "update",
    "Cancel": "cancel",
}

_EVENT_KEYWORD_TO_HAZARD = {
    "flood": "flood",
    "flash flood": "flood",
    "rain": "extreme_rainfall",
    "rainfall": "extreme_rainfall",
    "landslide": "landslide",
    "earthquake": "earthquake",
    "fire": "wildfire",
    "cyclone": "cyclone",
}


class CapAdapterError(ValueError):
    """Raised when a CAP payload is missing required fields or malformed."""


def _guess_hazard_type(event_name: str) -> str:
    lowered = event_name.lower()
    for keyword, hazard in _EVENT_KEYWORD_TO_HAZARD.items():
        if keyword in lowered:
            return hazard
    return "generic"


def parse_cap_alert(raw: dict[str, Any]) -> DisasterEventIn:
    """Validate + convert one CAP-like alert dict into a canonical event.

    Raises CapAdapterError on missing/malformed required fields rather than
    silently producing a partially-populated event.
    """
    try:
        identifier = raw["identifier"]
        sender = raw["sender"]
        sent = raw["sent"]
        msg_type = raw["msgType"]
        info = raw["info"][0]
    except (KeyError, IndexError) as exc:
        raise CapAdapterError(f"CAP alert missing required field: {exc}") from exc

    if msg_type not in _CAP_MSGTYPE_TO_LIFECYCLE:
        raise CapAdapterError(f"Unsupported CAP msgType: {msg_type!r}")

    try:
        headline = info["headline"]
        event_name = info["event"]
        severity_raw = info["severity"]
        effective = info["effective"]
    except KeyError as exc:
        raise CapAdapterError(f"CAP alert.info missing required field: {exc}") from exc

    severity = _CAP_SEVERITY_MAP.get(severity_raw)
    if severity is None:
        raise CapAdapterError(f"Unknown CAP severity: {severity_raw!r}")

    certainty = _CAP_CERTAINTY_MAP.get(info.get("certainty", "Unknown"), "unknown")
    expires_raw = info.get("expires")

    area = info.get("area", [{}])[0] if info.get("area") else {}
    geometry_geojson = None
    polygon = area.get("polygon")
    if polygon:
        # CAP polygon: "lat,lon lat,lon ..." -> GeoJSON ring is [lon, lat].
        try:
            ring = [
                [float(lon), float(lat)]
                for lat, lon in (pair.split(",") for pair in polygon.split())
            ]
            geometry_geojson = json.dumps({"type": "Polygon", "coordinates": [ring]})
        except (ValueError, IndexError) as exc:
            raise CapAdapterError(f"Malformed CAP polygon: {exc}") from exc

    return DisasterEventIn(
        source=sender,
        source_event_id=identifier,
        lifecycle=_CAP_MSGTYPE_TO_LIFECYCLE[msg_type],
        hazard_type=_guess_hazard_type(event_name),
        severity=severity,
        certainty=certainty,
        headline=headline,
        description=info.get("description", ""),
        issued_at=datetime.fromisoformat(sent),
        effective_from=datetime.fromisoformat(effective),
        expires_at=datetime.fromisoformat(expires_raw) if expires_raw else None,
        geometry_geojson=geometry_geojson,
        affected_area=area.get("areaDesc"),
        metadata_json=json.dumps({"web": info.get("web"), "instruction": info.get("instruction")}),
        is_simulated=True,
        confidence=0.75,
    )


class CapFixtureAdapter:
    """WarningAdapter implementation reading from local JSON fixtures.

    This satisfies the WarningAdapter Protocol (see app/adapters/base.py)
    while being explicit that, for now, it is fixture-backed rather than a
    live feed integration.
    """

    def __init__(self, fixture_names: list[str] | None = None) -> None:
        self.fixture_names = fixture_names or [
            "cap_red_rainfall.json",
            "cap_flash_flood.json",
            "cap_landslide.json",
        ]

    async def fetch_alerts(self) -> list[DisasterEventIn]:
        events = []
        for name in self.fixture_names:
            raw = json.loads((FIXTURES_DIR / name).read_text())
            events.append(parse_cap_alert(raw))
        return events
