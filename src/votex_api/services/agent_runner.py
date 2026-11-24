"""Agent Runner service for executing Indic tasks asynchronously with concurrency controls."""

import asyncio
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import time
from typing import Any, Dict, Optional

from votex_api.config import get_settings
from votex_api.db import get_db_context
from votex_api.models import Task
from votex_api.repositories import TaskRepository
from votex_api.services.event_broker import event_broker
from votex_api.services.sanitizer import sanitize_text

log = logging.getLogger(__name__)
settings = get_settings()

_concurrency_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_TASKS)

TOOL_LABELS = {
    "inspect_media": "Inspect",
    "detect_language": "Detect Language",
    "transcribe_audio": "Transcribe",
    "translate_text": "Translate",
    "synthesize_speech": "Speak",
    "ocr_document": "OCR",
    "list_voices": "Voices",
}


def _map_tool_label(raw_tool: str) -> str:
    return TOOL_LABELS.get(raw_tool, raw_tool.replace("_", " ").title())


class AgentRunner:
    @staticmethod
    async def execute_task(task_id: str) -> None:
        """Executes task inside the concurrency semaphore."""
        async with _concurrency_semaphore:
            await AgentRunner._run(task_id)

    @staticmethod
    async def _run(task_id: str) -> None:
        from bodhan_agent.loop import run_task

        with get_db_context() as db:
            task_repo = TaskRepository(db)
            task = task_repo.get_by_id(task_id)
            if not task:
                log.error("Task not found for execution: %s", task_id)
                return

            workspace_root = Path(settings.WORKSPACES_DIR) / task.workspace_rel_path
            inputs_dir = workspace_root / "inputs"
            outputs_dir = workspace_root / "outputs"
            outputs_dir.mkdir(parents=True, exist_ok=True)

            task_repo.update_status(task_id=task_id, status="running")

        await event_broker.publish(
            task_id=task_id,
            event_type="task_started",
            data={
                "task_id": task_id,
                "prompt": task.prompt,
                "max_steps": task.max_steps,
                "max_cost_inr": float(task.max_cost_inr),
                "max_seconds": task.max_seconds,
            },
        )

        seq_counter = 0
        t_start = time.monotonic()

        async def on_event(ev: Dict[str, Any]) -> None:
            nonlocal seq_counter
            ev_type = ev.get("type", "")

            if ev_type == "step_started":
                seq_counter += 1
                raw_tool = ev.get("tool", "")
                tool_label = _map_tool_label(raw_tool)
                with get_db_context() as inner_db:
                    inner_repo = TaskRepository(inner_db)
                    inner_repo.add_step(
                        task_id=task_id,
                        seq=seq_counter,
                        tool_label=tool_label,
                        status="started",
                        summary=f"Running {tool_label}...",
                    )

                await event_broker.publish(
                    task_id=task_id,
                    event_type="step_started",
                    data={
                        "seq": seq_counter,
                        "tool": tool_label,
                        "summary": f"Running {tool_label}...",
                    },
                )

            elif ev_type == "step_completed":
                raw_tool = ev.get("tool", "")
                tool_label = _map_tool_label(raw_tool)
                cost = float(ev.get("cost_inr", 0.0))
                duration_ms = int(ev.get("duration_ms", 0))
                cached = bool(ev.get("cached", False))
                ok = bool(ev.get("ok", True))
                error = sanitize_text(ev.get("error", "")) if not ok else None
                summary = f"Completed {tool_label} (₹{cost:.2f})" if ok else f"{tool_label} failed: {error}"

                with get_db_context() as inner_db:
                    inner_repo = TaskRepository(inner_db)
                    inner_repo.add_step(
                        task_id=task_id,
                        seq=seq_counter,
                        tool_label=tool_label,
                        status="completed" if ok else "failed",
                        summary=summary,
                        cost_inr=cost,
                        duration_ms=duration_ms,
                        cached=cached,
                    )

                await event_broker.publish(
                    task_id=task_id,
                    event_type="step_completed",
                    data={
                        "seq": seq_counter,
                        "tool": tool_label,
                        "cost_inr": cost,
                        "duration_ms": duration_ms,
                        "cached": cached,
                        "ok": ok,
                        "summary": summary,
                    },
                )

            elif ev_type == "budget_update":
                elapsed = time.monotonic() - t_start
                steps_used = ev.get("steps_used", seq_counter)
                cost_inr = float(ev.get("cost_inr", 0.0))

                with get_db_context() as inner_db:
                    inner_repo = TaskRepository(inner_db)
                    inner_repo.update_status(
                        task_id=task_id,
                        status="running",
                        steps_used=steps_used,
                        cost_inr=cost_inr,
                        elapsed_seconds=elapsed,
                    )

                await event_broker.publish(
                    task_id=task_id,
                    event_type="budget_update",
                    data={
                        "steps_used": steps_used,
                        "cost_inr": cost_inr,
                        "elapsed_seconds": elapsed,
                    },
                )

        try:
            # Run core loop with safety guards intact
            await run_task(
                task=task.prompt,
                files=inputs_dir,
                out_dir=outputs_dir,
                max_steps=task.max_steps,
                max_cost_inr=float(task.max_cost_inr),
                on_event=on_event,
            )

            # Process produced outputs & reports
            elapsed = time.monotonic() - t_start
            report_json_path = outputs_dir / "report.json"
            result_md_path = outputs_dir / "result.md"
            report_md_path = outputs_dir / "report.md"

            status = "completed"
            verification_json = None
            summary = ""

            if report_json_path.exists():
                try:
                    rep_data = json.loads(report_json_path.read_text(encoding="utf-8"))
                    status = "completed" if rep_data.get("status") == "completed" else "halted_budget"
                    verifications = rep_data.get("verification_results", [])
                    if verifications:
                        verification_json = json.dumps(verifications)
                except Exception:
                    pass

            with get_db_context() as final_db:
                final_repo = TaskRepository(final_db)

                # 1. Markdown report
                md_file = result_md_path if result_md_path.exists() else report_md_path
                if md_file.exists():
                    final_repo.add_artifact(
                        task_id=task_id,
                        kind="report_md",
                        display_name="report.md",
                        rel_path="report.md",
                        mime_type="text/markdown",
                        size_bytes=md_file.stat().st_size,
                    )
                    summary = md_file.read_text(encoding="utf-8", errors="replace")

                # 2. JSON report
                if report_json_path.exists():
                    final_repo.add_artifact(
                        task_id=task_id,
                        kind="report_json",
                        display_name="report.json",
                        rel_path="report.json",
                        mime_type="application/json",
                        size_bytes=report_json_path.stat().st_size,
                    )

                # 3. Trace log
                trace_path = outputs_dir / "trace.jsonl"
                if trace_path.exists():
                    final_repo.add_artifact(
                        task_id=task_id,
                        kind="trace_jsonl",
                        display_name="trace.jsonl",
                        rel_path="trace.jsonl",
                        mime_type="application/x-ndjson",
                        size_bytes=trace_path.stat().st_size,
                    )

                # 4. Media artifacts
                artifacts_dir = outputs_dir / "artifacts"
                if artifacts_dir.exists():
                    for art in artifacts_dir.iterdir():
                        if art.is_file():
                            ext = art.suffix.lower()
                            kind = "audio" if ext in (".wav", ".mp3", ".m4a") else ("subtitles" if ext in (".srt", ".vtt") else "other")
                            mime = "audio/wav" if ext == ".wav" else ("audio/mpeg" if ext == ".mp3" else "application/octet-stream")
                            final_repo.add_artifact(
                                task_id=task_id,
                                kind=kind,
                                display_name=art.name,
                                rel_path=f"artifacts/{art.name}",
                                mime_type=mime,
                                size_bytes=art.stat().st_size,
                            )

                final_repo.update_status(
                    task_id=task_id,
                    status=status,
                    elapsed_seconds=elapsed,
                    verification_json=verification_json,
                )

            await event_broker.publish(
                task_id=task_id,
                event_type="task_finished",
                data={
                    "task_id": task_id,
                    "status": status,
                    "elapsed_seconds": elapsed,
                    "summary": summary,
                },
            )

        except Exception as exc:
            log.error("Task %s execution error: %s", task_id, exc, exc_info=True)
            elapsed = time.monotonic() - t_start
            err_msg = sanitize_text(str(exc))

            with get_db_context() as err_db:
                err_repo = TaskRepository(err_db)
                err_repo.update_status(
                    task_id=task_id,
                    status="failed",
                    elapsed_seconds=elapsed,
                    error_message=err_msg,
                )

            await event_broker.publish(
                task_id=task_id,
                event_type="task_failed",
                data={
                    "task_id": task_id,
                    "status": "failed",
                    "error": err_msg,
                    "elapsed_seconds": elapsed,
                },
            )
