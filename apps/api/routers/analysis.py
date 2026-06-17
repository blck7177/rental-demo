"""Analysis router — fit scoring and side-by-side comparison."""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.fit_analysis_service import analyze_fit
from src.services.comparison_service import compare_listings
from src.services.intake_service import get_latest_profile, DEFAULT_DEMO_PROFILE

router = APIRouter()


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


def _get_profile(profile: Optional[dict]) -> dict:
    if profile:
        return profile
    saved = get_latest_profile()
    return saved or DEFAULT_DEMO_PROFILE


class FitRequest(BaseModel):
    listing_id: str
    profile: Optional[dict] = None


class CompareRequest(BaseModel):
    listing_ids: list[str]
    profile: Optional[dict] = None


@router.post("/analysis/fit")
def fit_analysis(req: FitRequest):
    """Generate personalized fit score and analysis for a listing."""
    profile = _get_profile(req.profile)
    result = analyze_fit(req.listing_id, profile, demo_mode=_demo_mode())
    return result


@router.post("/analysis/compare")
def compare(req: CompareRequest):
    """Generate side-by-side comparison of 2–3 listings with AI verdicts."""
    profile = _get_profile(req.profile)
    result = compare_listings(req.listing_ids, profile, demo_mode=_demo_mode())
    return result
