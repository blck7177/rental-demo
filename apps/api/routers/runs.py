"""Runs router — demo pipeline status and run management."""

from __future__ import annotations

import time
import uuid
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

RUNS_DIR = Path(__file__).parents[3] / "runs"

# In-memory run state for demo
_demo_runs: dict[str, dict] = {}

DEMO_STEPS = [
    {"step": "search_queries_generated", "label": "Search queries generated", "count": 4},
    {"step": "candidates_found", "label": "Candidate URLs found", "count": 18},
    {"step": "fetch_attempted", "label": "Pages fetched", "count": 15},
    {"step": "fetch_succeeded", "label": "Successfully fetched", "count": 13},
    {"step": "structured", "label": "Structured via LLM", "count": 13},
    {"step": "validated", "label": "Passed validation", "count": 13},
    {"step": "db_inserted", "label": "Inserted into database", "count": 13},
]


class RunRequest(BaseModel):
    profile_id: str = "demo_profile_lic_001"
    mode: str = "demo"  # "demo" | "live"


@router.post("/runs/demo")
def start_demo_run(req: RunRequest):
    """Start a demo pipeline run (stable, uses seed data)."""
    run_id = f"demo_run_{uuid.uuid4().hex[:8]}"
    _demo_runs[run_id] = {
        "run_id": run_id,
        "profile_id": req.profile_id,
        "mode": req.mode,
        "status": "running",
        "started_at": time.time(),
        "steps_completed": 0,
        "steps": DEMO_STEPS,
    }
    # Immediately mark complete for demo
    _demo_runs[run_id]["status"] = "complete"
    _demo_runs[run_id]["steps_completed"] = len(DEMO_STEPS)

    return {
        "run_id": run_id,
        "status": "complete",
        "message": "Demo run complete — seed data loaded into database",
        "steps": DEMO_STEPS,
        "summary": {
            "candidates_found": 18,
            "fetch_succeeded": 13,
            "db_inserted": 13,
            "sources": ["streeteasy.com", "renthop.com", "apartments.com"],
            "neighborhoods": ["Long Island City", "Hunters Point", "Dutch Kills", "Sunnyside"],
        },
    }


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    """Get run status."""
    if run_id in _demo_runs:
        return _demo_runs[run_id]
    # Check disk
    run_dir = RUNS_DIR / run_id
    if run_dir.exists():
        summary_file = run_dir / "run_summary.json"
        if summary_file.exists():
            import json
            return json.loads(summary_file.read_text())
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Run {run_id} not found")


@router.get("/runs")
def list_runs():
    """List recent runs."""
    runs = list(_demo_runs.values())
    # Also check disk
    RUNS_DIR.mkdir(exist_ok=True)
    for run_dir in sorted(RUNS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)[:5]:
        if run_dir.is_dir():
            summary_file = run_dir / "run_summary.json"
            if summary_file.exists():
                import json
                try:
                    runs.append(json.loads(summary_file.read_text()))
                except Exception:
                    pass
    return {"runs": runs}
