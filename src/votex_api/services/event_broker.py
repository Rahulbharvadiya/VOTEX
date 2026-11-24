"""In-memory pub/sub broker for Server-Sent Events (SSE) with replay and heartbeats."""

import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import AsyncGenerator, Dict, List, Set
from votex_api.schemas.event import TaskEventDTO
from votex_api.services.sanitizer import sanitize_payload

log = logging.getLogger(__name__)


class EventBroker:
    def __init__(self):
        # task_id -> set of asyncio.Queue
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # task_id -> list of TaskEventDTO
        self._history: Dict[str, List[TaskEventDTO]] = {}
        # task_id -> monotonic sequence counter
        self._counters: Dict[str, int] = {}
        self._lock = asyncio.Lock()

    async def publish(self, task_id: str, event_type: str, data: dict) -> TaskEventDTO:
        async with self._lock:
            seq = self._counters.get(task_id, 0) + 1
            self._counters[task_id] = seq

            # Always scrub secrets and vendor branding
            safe_data = sanitize_payload(data)

            event = TaskEventDTO(
                event_id=seq,
                task_id=task_id,
                event_type=event_type,
                data=safe_data,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )

            if task_id not in self._history:
                self._history[task_id] = []
            self._history[task_id].append(event)

            # Broadcast to all active listener queues
            queues = self._subscribers.get(task_id, set())
            for q in list(queues):
                try:
                    q.put_nowait(event)
                except asyncio.QueueFull:
                    pass

            return event

    async def subscribe(
        self,
        task_id: str,
        last_event_id: int = 0,
        heartbeat_secs: int = 15,
    ) -> AsyncGenerator[str, None]:
        q = asyncio.Queue(maxsize=100)

        async with self._lock:
            if task_id not in self._subscribers:
                self._subscribers[task_id] = set()
            self._subscribers[task_id].add(q)

            # Collect replay events if client passed Last-Event-ID
            replay_events = [
                ev for ev in self._history.get(task_id, [])
                if ev.event_id > last_event_id
            ]

        try:
            # Replay historical missed events first
            for ev in replay_events:
                yield f"id: {ev.event_id}\nevent: {ev.event_type}\ndata: {ev.model_dump_json()}\n\n"

            # Stream live events
            while True:
                try:
                    ev: TaskEventDTO = await asyncio.wait_for(q.get(), timeout=heartbeat_secs)
                    yield f"id: {ev.event_id}\nevent: {ev.event_type}\ndata: {ev.model_dump_json()}\n\n"

                    # Terminal events close stream cleanly
                    if ev.event_type in ("task_finished", "task_failed", "budget_halted"):
                        break
                except asyncio.TimeoutError:
                    # Send standard SSE keepalive comment
                    yield ": ping\n\n"
        finally:
            async with self._lock:
                if task_id in self._subscribers and q in self._subscribers[task_id]:
                    self._subscribers[task_id].remove(q)
                    if not self._subscribers[task_id]:
                        del self._subscribers[task_id]


event_broker = EventBroker()
