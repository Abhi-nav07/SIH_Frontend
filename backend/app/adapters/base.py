"""Adapter interfaces (V0.3 spec item 12).

Interfaces only — no scraping, no unverified "official API" claims. Real
sources get wired in later behind these Protocols once access is confirmed;
until then, adapters read from local fixtures/tests only.
"""

from __future__ import annotations

from typing import Protocol

from app.schemas.events import DisasterEventIn


class WarningAdapter(Protocol):
    """Anything that can produce canonical DisasterEvent payloads."""

    async def fetch_alerts(self) -> list[DisasterEventIn]: ...
