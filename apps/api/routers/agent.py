"""Agent router — POST /api/agent/action

Translates natural language broker commands into structured actions,
dispatching to the appropriate existing services.

Request:
  {
    "text": "帮 Emily 找 LIC studio，预算 3200 以下，安静优先",
    "context": {
      "client_id": "cli_emily_chen_demo",
      "client_name": "Emily Chen",
      "selected_listing_ids": ["lst_abc", "lst_def"],
      "target_listing_id": "lst_abc",
      "top_listing_ids": ["lst_abc", "lst_def", "lst_ghi"]
    }
  }

Response:
  {
    "action": "run_search",
    "agent_reply": "已为 Emily 搜索...",
    "ui_update": { "tab": "listings", "listings": [...] },
    "classified_intent": { "action": ..., "params": ..., "reasoning": ... }
  }
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.agent_action_service import dispatch_action

router = APIRouter()


class AgentActionRequest(BaseModel):
    text: str
    context: Optional[dict[str, Any]] = None


@router.post("/agent/action")
def agent_action(req: AgentActionRequest):
    """Classify broker command and dispatch to appropriate service."""
    result = dispatch_action(
        raw_text=req.text,
        context=req.context,
    )
    return result
