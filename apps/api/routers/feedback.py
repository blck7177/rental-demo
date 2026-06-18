"""Feedback router — client feedback recording and sent history.

Endpoints:
  POST /api/feedback                          record client feedback
  GET  /api/feedback/{client_id}              get all feedback for client
  POST /api/feedback/sent                     record a sent message
  GET  /api/feedback/sent/{client_id}         get sent history for client
  GET  /api/feedback/followup/{client_id}     get follow-up summary
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.feedback_service import (
    record_feedback,
    get_client_feedback,
    record_sent,
    get_sent_history,
    get_follow_up_summary,
)

router = APIRouter()


class FeedbackRequest(BaseModel):
    client_id: str
    feedback_type: str = "general"
    text: str
    listing_id: Optional[str] = None
    impact: Optional[str] = None


class SentHistoryRequest(BaseModel):
    client_id: str
    listing_ids: list[str]
    message_preview: str
    channel: str = "wechat"
    sent: bool = False


@router.post("/feedback")
def create_feedback(req: FeedbackRequest):
    """Record a client feedback entry."""
    entry = record_feedback(
        client_id=req.client_id,
        feedback_type=req.feedback_type,
        text=req.text,
        listing_id=req.listing_id,
        impact=req.impact,
    )
    return {"entry": entry, "status": "recorded"}


@router.post("/feedback/sent")
def record_sent_message(req: SentHistoryRequest):
    """Record a drafted or sent message."""
    entry = record_sent(
        client_id=req.client_id,
        listing_ids=req.listing_ids,
        message_preview=req.message_preview,
        channel=req.channel,
        sent=req.sent,
    )
    return {"entry": entry, "status": "recorded"}


@router.get("/feedback/sent/{client_id}")
def get_client_sent_history(client_id: str):
    """Get message sent history for a client."""
    entries = get_sent_history(client_id)
    return {"client_id": client_id, "sent_history": entries, "count": len(entries)}


@router.get("/feedback/followup/{client_id}")
def get_followup_summary(client_id: str):
    """Get follow-up summary for a client."""
    summary = get_follow_up_summary(client_id)
    return summary


@router.get("/feedback/{client_id}")
def get_feedback(client_id: str, limit: int = 20):
    """Get feedback history for a client."""
    entries = get_client_feedback(client_id)
    return {"client_id": client_id, "feedback": entries[:limit], "count": len(entries)}
