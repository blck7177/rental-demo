"""Feedback Service — records client feedback and message sent history.

Data stored in:
  db/feedback.jsonl      — client feedback entries (re-ranking hints, rejections, preferences)
  db/sent_history.jsonl  — records of messages sent to clients
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_DIR = Path(__file__).parents[2] / "db"


def _ensure_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)


def _feedback_path() -> Path:
    return DB_DIR / "feedback.jsonl"


def _sent_history_path() -> Path:
    return DB_DIR / "sent_history.jsonl"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_line(path: Path, entry: dict[str, Any]) -> None:
    _ensure_db()
    with path.open("a") as f:
        f.write(json.dumps(entry) + "\n")


def _load_lines(path: Path) -> list[dict[str, Any]]:
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


# ---------- Feedback ----------

def record_feedback(
    client_id: str,
    feedback_type: str,
    text: str,
    listing_id: str | None = None,
    impact: str | None = None,
) -> dict[str, Any]:
    """Record a feedback entry for a client.

    feedback_type: "rejection" | "preference" | "budget_change" | "general"
    impact: optional description of how this affects the search
    """
    entry: dict[str, Any] = {
        "feedback_id": f"fb_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "type": feedback_type,
        "text": text,
        "listing_id": listing_id,
        "impact": impact,
        "recorded_at": _now(),
    }
    _append_line(_feedback_path(), entry)
    return entry


def get_client_feedback(client_id: str) -> list[dict[str, Any]]:
    """Return all feedback entries for a client, newest first."""
    all_entries = _load_lines(_feedback_path())
    entries = [e for e in all_entries if e.get("client_id") == client_id]
    return list(reversed(entries))


def get_recent_feedback(client_id: str, limit: int = 10) -> list[dict[str, Any]]:
    """Return the N most recent feedback entries for a client."""
    return get_client_feedback(client_id)[:limit]


# ---------- Sent History ----------

def record_sent(
    client_id: str,
    listing_ids: list[str],
    message_preview: str,
    channel: str = "wechat",
    sent: bool = False,
) -> dict[str, Any]:
    """Record that a message was drafted or sent to a client."""
    entry: dict[str, Any] = {
        "sent_id": f"sent_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "listing_ids": listing_ids,
        "message_preview": message_preview[:300],
        "channel": channel,
        "sent": sent,
        "created_at": _now(),
    }
    _append_line(_sent_history_path(), entry)
    return entry


def get_sent_history(client_id: str) -> list[dict[str, Any]]:
    """Return all sent history for a client, newest first."""
    all_entries = _load_lines(_sent_history_path())
    entries = [e for e in all_entries if e.get("client_id") == client_id]
    return list(reversed(entries))


def get_follow_up_summary(client_id: str) -> dict[str, Any]:
    """Generate a quick follow-up summary for a client based on feedback + sent history."""
    feedback = get_client_feedback(client_id)
    sent = get_sent_history(client_id)

    rejections = [f for f in feedback if f.get("type") == "rejection"]
    preferences = [f for f in feedback if f.get("type") in ("preference", "general")]
    sent_count = len([s for s in sent if s.get("sent")])
    draft_count = len([s for s in sent if not s.get("sent")])

    needs_followup = len(feedback) > 0 and sent_count == 0
    suggested_next = []

    if rejections:
        suggested_next.append("Re-search with updated criteria based on client feedback")
    if draft_count > 0:
        suggested_next.append(f"Send {draft_count} pending draft message(s)")
    if not feedback and not sent:
        suggested_next.append("Send initial shortlist to client")

    return {
        "client_id": client_id,
        "feedback_count": len(feedback),
        "rejections": len(rejections),
        "preference_notes": len(preferences),
        "messages_sent": sent_count,
        "messages_drafted": draft_count,
        "needs_followup": needs_followup,
        "suggested_next_steps": suggested_next,
        "recent_feedback": [f.get("text") for f in feedback[:3]],
    }
