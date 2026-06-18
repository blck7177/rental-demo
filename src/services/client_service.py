"""Client service — manages agent client profiles, notes, shortlist, and status.

Data is stored in lightweight JSONL files under db/:
  db/clients.jsonl       — client profiles
  db/shortlists.jsonl    — per-client listing shortlist entries
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_DIR = Path(__file__).parents[2] / "db"

DEMO_CLIENT: dict[str, Any] = {
    "client_id": "cli_emily_chen_demo",
    "name": "Emily Chen",
    "status": "active",
    "move_in": "2024-08-01",
    "budget": {"min": 3000, "max": 3300},
    "neighborhoods": ["Long Island City", "Astoria"],
    "unit_type": "studio",
    "commute_destination": "Midtown",
    "must_haves": ["in-unit laundry", "elevator", "quiet building"],
    "avoid": ["walk-up", "bad management"],
    "weights": {
        "commute": 0.8,
        "building_quality": 0.75,
        "price": 0.6,
        "amenities": 0.45,
    },
    "channel": "wechat",
    "notes": [
        "Sensitive to noise",
        "Prefers newer buildings (post-2010)",
        "Asked about management reviews",
        "Does not want walk-up",
    ],
    "shortlist": {"saved": 0, "sent": 0, "liked": 0, "rejected": 0},
    "created_at": "2024-06-01T10:00:00Z",
    "updated_at": "2024-06-17T10:00:00Z",
}


# ---------- helpers ----------

def _ensure_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)


def _clients_path() -> Path:
    return DB_DIR / "clients.jsonl"


def _shortlists_path() -> Path:
    return DB_DIR / "shortlists.jsonl"


def _load_clients() -> list[dict[str, Any]]:
    path = _clients_path()
    if not path.exists():
        return []
    clients = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                clients.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return clients


def _save_clients(clients: list[dict[str, Any]]) -> None:
    _ensure_db()
    _clients_path().write_text("\n".join(json.dumps(c) for c in clients) + "\n")


def _load_shortlist_entries() -> list[dict[str, Any]]:
    path = _shortlists_path()
    if not path.exists():
        return []
    entries = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


def _append_shortlist_entry(entry: dict[str, Any]) -> None:
    _ensure_db()
    with _shortlists_path().open("a") as f:
        f.write(json.dumps(entry) + "\n")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- public API ----------

def list_clients(include_demo: bool = True) -> list[dict[str, Any]]:
    """Return all clients. Always includes the hardcoded demo client first."""
    clients = _load_clients()
    # Avoid duplicate demo client
    non_demo = [c for c in clients if c.get("client_id") != DEMO_CLIENT["client_id"]]
    result = [DEMO_CLIENT] + non_demo if include_demo else non_demo
    return result


def get_client(client_id: str) -> dict[str, Any] | None:
    """Get a single client by ID."""
    if client_id == DEMO_CLIENT["client_id"]:
        return DEMO_CLIENT
    clients = _load_clients()
    for c in clients:
        if c.get("client_id") == client_id:
            return c
    return None


def create_client(
    name: str,
    budget_min: int | None = None,
    budget_max: int | None = None,
    neighborhoods: list[str] | None = None,
    move_in: str | None = None,
    channel: str = "wechat",
    notes: list[str] | None = None,
    must_haves: list[str] | None = None,
    avoid: list[str] | None = None,
    weights: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Create a new client profile and persist it."""
    client_id = f"cli_{uuid.uuid4().hex[:12]}"
    now = _now()
    client: dict[str, Any] = {
        "client_id": client_id,
        "name": name,
        "status": "active",
        "move_in": move_in,
        "budget": {"min": budget_min, "max": budget_max},
        "neighborhoods": neighborhoods or [],
        "must_haves": must_haves or [],
        "avoid": avoid or [],
        "weights": weights or {"commute": 0.5, "building_quality": 0.5, "price": 0.5, "amenities": 0.3},
        "channel": channel,
        "notes": notes or [],
        "shortlist": {"saved": 0, "sent": 0, "liked": 0, "rejected": 0},
        "created_at": now,
        "updated_at": now,
    }
    clients = _load_clients()
    clients.append(client)
    _save_clients(clients)
    return client


def update_client(client_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    """Patch an existing client. Returns updated client or None if not found."""
    if client_id == DEMO_CLIENT["client_id"]:
        # Demo client is read-only in storage; return merged view
        return {**DEMO_CLIENT, **updates, "client_id": client_id}

    clients = _load_clients()
    for i, c in enumerate(clients):
        if c.get("client_id") == client_id:
            clients[i] = {**c, **updates, "updated_at": _now()}
            _save_clients(clients)
            return clients[i]
    return None


def append_client_note(client_id: str, note: str) -> dict[str, Any] | None:
    """Append a note to a client's notes list."""
    client = get_client(client_id)
    if not client:
        return None
    existing = list(client.get("notes") or [])
    existing.append(note)
    return update_client(client_id, {"notes": existing})


def get_client_shortlist(client_id: str) -> list[dict[str, Any]]:
    """Return all shortlist entries for a client."""
    entries = _load_shortlist_entries()
    return [e for e in entries if e.get("client_id") == client_id]


def add_to_shortlist(
    client_id: str,
    listing_id: str,
    status: str = "saved",
    feedback: str | None = None,
) -> dict[str, Any]:
    """Add or update a listing in a client's shortlist."""
    entry = {
        "shortlist_id": f"sl_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "listing_id": listing_id,
        "status": status,  # saved | sent | liked | rejected
        "feedback": feedback,
        "added_at": _now(),
    }
    _append_shortlist_entry(entry)
    return entry


def get_client_summary(client_id: str) -> dict[str, Any]:
    """Return client + computed shortlist counts."""
    client = get_client(client_id)
    if not client:
        return {}
    shortlist = get_client_shortlist(client_id)
    statuses = [e.get("status") for e in shortlist]
    summary = dict(client)
    summary["shortlist"] = {
        "saved": statuses.count("saved"),
        "sent": statuses.count("sent"),
        "liked": statuses.count("liked"),
        "rejected": statuses.count("rejected"),
        "total": len(shortlist),
    }
    return summary
