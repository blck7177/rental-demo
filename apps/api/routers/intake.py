"""Intake router — POST /api/intake, GET /api/intake/profile."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.intake_service import parse_intake, get_latest_profile, DEFAULT_DEMO_PROFILE

router = APIRouter()


class IntakeRequest(BaseModel):
    nl_text: str
    form_data: Optional[dict] = None
    profile_id: Optional[str] = None


@router.post("/intake")
def process_intake(req: IntakeRequest):
    """Parse natural language requirements into a structured user profile."""
    profile = parse_intake(
        nl_text=req.nl_text,
        form_data=req.form_data,
        existing_profile_id=req.profile_id,
    )
    return {"profile": profile, "status": "created"}


@router.get("/intake/profile")
def get_current_profile():
    """Get the most recently created user profile, or the default demo profile."""
    profile = get_latest_profile()
    if not profile:
        profile = DEFAULT_DEMO_PROFILE
    return {"profile": profile}


@router.get("/intake/demo-profile")
def get_demo_profile():
    """Get the built-in demo profile for LIC studio search."""
    return {"profile": DEFAULT_DEMO_PROFILE}
