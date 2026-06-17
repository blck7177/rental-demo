"""Runs router — demo runs, live OpenClaw runs, and import."""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from src.services.openclaw_service import (
    openclaw_available,
    list_runs as list_openclaw_runs,
    read_run_artifacts,
    trigger_live_run,
    STEP_LABELS,
)
from src.services.run_import_service import import_from_openclaw

router = APIRouter()

RUNS_DIR = Path(__file__).parents[3] / "runs"
_demo_runs: dict[str, dict] = {}
_live_runs: dict[str, dict] = {}

DEMO_STEPS = [{"step": s, "label": l, "count": c} for s, l, c in STEP_LABELS]


class RunRequest(BaseModel):
    profile_id: str = "demo_profile_lic_001"
    mode: str = "demo"


class ImportRequest(BaseModel):
    run_id: str | None = None


@router.post("/runs/demo")
def start_demo_run(req: RunRequest):
    """Start a stable demo run using seed data."""
    run_id = f"demo_run_{uuid.uuid4().hex[:8]}"
    _demo_runs[run_id] = {"run_id": run_id, "mode": "demo", "status": "complete", "started_at": time.time(), "steps": DEMO_STEPS}
    return {
        "run_id": run_id, "status": "complete", "mode": "demo",
        "message": "Demo run complete — seed data loaded",
        "steps": DEMO_STEPS,
        "summary": {
            "candidates_found": 18, "fetch_succeeded": 13, "db_inserted": 13,
            "sources": ["streeteasy.com", "renthop.com", "apartments.com"],
            "neighborhoods": ["Long Island City", "Hunters Point", "Dutch Kills", "Sunnyside"],
        },
    }


@router.post("/runs/live")
def start_live_run(req: RunRequest, background_tasks: BackgroundTasks):
    """Trigger a live pipeline run via nyc-rentals-openclaw wrappers."""
    if not openclaw_available():
        return {
            "run_id": None, "status": "unavailable", "mode": "live",
            "message": "nyc-rentals-openclaw not available. Check OPENCLAW_RENTAL_REPO_PATH in .env",
            "openclaw_available": False,
        }

    run_id = f"live_run_{uuid.uuid4().hex[:8]}"
    _live_runs[run_id] = {"run_id": run_id, "mode": "live", "status": "running", "started_at": time.time()}

    def _run():
        result = trigger_live_run(req.profile_id)
        _live_runs[run_id].update(result)
        _live_runs[run_id]["status"] = result.get("status", "complete")

    background_tasks.add_task(_run)
    return {"run_id": run_id, "status": "running", "mode": "live",
            "message": "Live run started. Poll GET /api/runs/{run_id} for status.",
            "openclaw_available": True}


@router.post("/runs/{run_id}/import")
def import_run(run_id: str):
    """Import listings from an OpenClaw run into rental-demo db."""
    return import_from_openclaw(run_id=None if run_id == "latest" else run_id)


@router.get("/runs/openclaw/status")
def openclaw_status():
    available = openclaw_available()
    from src.services.openclaw_service import RENTAL_REPO_PATH, get_openclaw_listings
    return {
        "available": available,
        "repo_path": str(RENTAL_REPO_PATH),
        "listings_in_db": len(get_openclaw_listings()) if available else 0,
        "recent_runs": list_openclaw_runs()[:3] if available else [],
    }


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    if run_id in _demo_runs:
        return _demo_runs[run_id]
    if run_id in _live_runs:
        run = dict(_live_runs[run_id])
        if run.get("status") == "complete":
            run["artifacts"] = read_run_artifacts(run_id)
        return run
    from src.services.openclaw_service import RENTAL_REPO_PATH
    run_dir = RENTAL_REPO_PATH / "runs" / run_id
    if run_dir.exists():
        return read_run_artifacts(run_id)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Run {run_id} not found")


@router.get("/runs")
def list_runs():
    runs = list(_demo_runs.values()) + list(_live_runs.values()) + list_openclaw_runs()
    return {"runs": runs, "openclaw_available": openclaw_available()}
