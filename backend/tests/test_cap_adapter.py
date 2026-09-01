import json

import pytest

from app.adapters.cap_adapter import CapAdapterError, FIXTURES_DIR, parse_cap_alert

FIXTURES = {
    "red_rainfall": "cap_red_rainfall.json",
    "flash_flood": "cap_flash_flood.json",
    "landslide": "cap_landslide.json",
    "cancel": "cap_cancel.json",
}


def _load(name: str) -> dict:
    return json.loads((FIXTURES_DIR / FIXTURES[name]).read_text())


def test_cap_alert_converts_to_canonical_event():
    event = parse_cap_alert(_load("red_rainfall"))
    assert event.hazard_type == "extreme_rainfall"
    assert event.severity == "extreme"
    assert event.certainty == "likely"
    assert event.lifecycle == "new"
    assert event.source == "imd.gov.in"
    assert event.source_event_id == "IMD-UK-2026-0091"
    assert event.geometry_geojson is not None
    assert event.is_simulated is True


def test_cap_flash_flood_hazard_type_guessed_from_event_name():
    event = parse_cap_alert(_load("flash_flood"))
    assert event.hazard_type == "flood"
    assert event.severity == "severe"


def test_cap_landslide_hazard_type():
    event = parse_cap_alert(_load("landslide"))
    assert event.hazard_type == "landslide"
    assert event.severity == "moderate"


def test_cap_cancel_lifecycle_maps_to_cancel():
    event = parse_cap_alert(_load("cancel"))
    assert event.lifecycle == "cancel"
    assert event.source_event_id == "IMD-UK-2026-0091"  # same id as the alert it cancels


def test_cap_polygon_parsed_into_geojson_lon_lat_order():
    event = parse_cap_alert(_load("red_rainfall"))
    geom = json.loads(event.geometry_geojson)
    assert geom["type"] == "Polygon"
    # CAP polygon pair is "lat,lon"; GeoJSON ring coordinate must be [lon, lat].
    first_point = geom["coordinates"][0][0]
    assert first_point == [78.30, 30.05]


def test_cap_missing_required_field_raises():
    bad = _load("red_rainfall")
    del bad["identifier"]
    with pytest.raises(CapAdapterError):
        parse_cap_alert(bad)


def test_cap_unknown_severity_raises():
    bad = _load("red_rainfall")
    bad["info"][0]["severity"] = "Catastrophic"  # not a valid CAP severity value
    with pytest.raises(CapAdapterError):
        parse_cap_alert(bad)


def test_cap_unsupported_msgtype_raises():
    bad = _load("red_rainfall")
    bad["msgType"] = "Ack"
    with pytest.raises(CapAdapterError):
        parse_cap_alert(bad)
