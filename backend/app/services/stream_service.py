"""Realtime scenario event stream (V0.3 spec item 14).

Minimal in-process pub/sub keyed by scenario id, exposed over SSE at
GET /api/v1/scenarios/{id}/stream. This is intentionally simple — a single
working integration example, not a full message-bus architecture. A
multi-process deployment would swap this for Redis pub/sub behind the same
`publish`/`subscribe` interface.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from enum import StrEnum


class StreamEventKind(StrEnum):
    ALERT_RECEIVED = "ALERT_RECEIVED"
    ALERT_UPDATED = "ALERT_UPDATED"
    ROAD_BLOCKED = "ROAD_BLOCKED"
    BRIDGE_STATUS_CHANGED = "BRIDGE_STATUS_CHANGED"
    SHELTER_CAPACITY_CHANGED = "SHELTER_CAPACITY_CHANGED"
    RESOURCE_STATUS_CHANGED = "RESOURCE_STATUS_CHANGED"
    DATA_CONFLICT = "DATA_CONFLICT"
    DATA_STALE = "DATA_STALE"


class ScenarioEventBus:
    def __init__(self) -> None:
        self._queues: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, scenario_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._queues.setdefault(scenario_id, []).append(queue)
        return queue

    def unsubscribe(self, scenario_id: str, queue: asyncio.Queue) -> None:
        subscribers = self._queues.get(scenario_id, [])
        if queue in subscribers:
            subscribers.remove(queue)

    async def publish(self, scenario_id: str, kind: StreamEventKind, payload: dict) -> None:
        message = {
            "kind": kind.value,
            "payload": payload,
            "at": datetime.now(timezone.utc).isoformat(),
        }
        for queue in self._queues.get(scenario_id, []):
            await queue.put(json.dumps(message))


event_bus = ScenarioEventBus()
