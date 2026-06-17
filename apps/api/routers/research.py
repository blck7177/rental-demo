"""Research router — building review intelligence."""

from __future__ import annotations

import os

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.review_research_service import get_review_research, research_building

router = APIRouter()


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


class ResearchRequest(BaseModel):
    listing_id: str


@router.get("/research/{listing_id}")
def get_research(listing_id: str):
    """Get existing review research for a listing."""
    result = get_review_research(listing_id, demo_mode=_demo_mode())
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"No research found for listing {listing_id}")
    return result


@router.post("/research/building")
def research(req: ResearchRequest):
    """Research a building — returns cached data or generates new research via LLM."""
    result = research_building(req.listing_id, demo_mode=_demo_mode())
    return result
