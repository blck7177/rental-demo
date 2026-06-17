"""OpenClaw adapter — filesystem bridge to nyc-rentals-openclaw pipeline."""

from __future__ import annotations

import json
import os
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any, Optional

RENTAL_REPO_PATH = Path(os.getenv("OPENCLAW_RENTAL_REPO_PATH", "/home/ubuntu/nyc-rentals-openclaw"))
WRAPPERS_PATH = RENTAL_REPO_PATH / "wrappers"

STEP_LABELS = [
    ("search_queries_generated", "Search queries generated", 4),
    ("candidates_found", "Candidate URLs found", 18),
    ("fetch_attempted", "Pages fetched", 15),
    ("fetch_succeeded", "Successfully fetched", 13),
    ("structured", "Structured via LLM", 13),
    ("validated", "Passed validation", 13),
    ("db_inserted", "Inserted into database", 13),
]


def openclaw_available() -> bool:
    return RENTAL_REPO_PATH.exists() and (RENTAL_REPO_PATH / "src").exists()


def list_runs() -> list[dict]:
    if not openclaw_available():
        return []
    runs_dir = RENTAL_REPO_PATH / "runs"
    if not runs_dir.exists():
        return []
    result = []
    for run_dir in sorted(runs_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)[:10]:
        if not run_dir.is_dir():
            continue
        summary_file = run_dir / "run_summary.json"
        if summary_file.exists():
            try:
                summary = json.loads(summary_file.read_text())
                summary["run_id"] = run_dir.name
                result.append(summary)
            except Exception:
                result.append({"run_id": run_dir.name, "status": "unknown"})
        else:
            result.append({"run_id": run_dir.name, "status": "no_summary"})
    return result


def read_run_artifacts(run_id: str) -> dict[str, Any]:
    if not openclaw_available():
        return {"error": "nyc-rentals-openclaw not available"}
    run_dir = RENTAL_REPO_PATH / "runs" / run_id
    if not run_dir.exists():
        return {"error": f"Run {run_id} not found"}

    artifacts: dict[str, Any] = {"run_id": run_id}
    for fname in ["run_summary.json", "validation_report.json"]:
        fpath = run_dir / fname
        if fpath.exists():
            try:
                artifacts[fname] = json.loads(fpath.read_text())
            except Exception:
                pass

    candidate_pool = run_dir / "candidate_pool.jsonl"
    if candidate_pool.exists():
        artifacts["candidate_count"] = len([l for l in candidate_pool.read_text().splitlines() if l.strip()])

    return artifacts


def get_openclaw_listings() -> list[dict]:
    if not openclaw_available():
        return []
    listings_file = RENTAL_REPO_PATH / "db" / "listings.jsonl"
    if not listings_file.exists():
        return []
    records = []
    for line in listings_file.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except Exception:
                pass
    return records


def trigger_live_run(profile_id: str = "default") -> dict[str, Any]:
    if not openclaw_available():
        return {"run_id": None, "status": "unavailable",
                "error": f"nyc-rentals-openclaw not found at {RENTAL_REPO_PATH}"}

    run_id = f"live_run_{uuid.uuid4().hex[:8]}"
    wrapper = WRAPPERS_PATH / "rental_run_discovery"
    if not wrapper.exists():
        return {"run_id": run_id, "status": "wrapper_missing",
                "error": f"rental_run_discovery wrapper not found at {wrapper}"}

    try:
        result = subprocess.run(
            [str(wrapper), "--run-id", run_id, "--profile", profile_id],
            capture_output=True, text=True, timeout=300, cwd=str(RENTAL_REPO_PATH),
        )
        return {
            "run_id": run_id,
            "status": "complete" if result.returncode == 0 else "failed",
            "returncode": result.returncode,
            "stdout": result.stdout[:1000] if result.stdout else "",
            "stderr": result.stderr[:500] if result.stderr else "",
        }
    except subprocess.TimeoutExpired:
        return {"run_id": run_id, "status": "timeout", "error": "Pipeline timed out after 300s"}
    except Exception as e:
        return {"run_id": run_id, "status": "error", "error": str(e)}
