"""Fit analysis service — generates personalized fit scores and explanations."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from src.services.llm_client import get_llm_client
from src.services.listing_service import get_listing_by_id

ARTIFACTS_DIR = Path(__file__).parents[2] / "artifacts" / "fit_reports"

FIT_ANALYSIS_SYSTEM = """
You are a NYC rental advisor helping a client evaluate if an apartment fits their needs.

Given a listing and a user profile, produce a detailed fit analysis in JSON format:
{
  "fit_score": <integer 0-100>,
  "fit_label": <"Excellent Match" | "Strong Match" | "Good Match" | "Partial Match" | "Poor Match">,
  "why_it_matches": [<list of 3-5 specific reasons this listing fits>],
  "tradeoffs": [<list of 2-4 honest tradeoffs or concerns>],
  "verdict": "<1-2 sentence bottom-line recommendation>",
  "score_breakdown": {
    "price_fit": <0-25>,
    "location_fit": <0-25>,
    "amenity_fit": <0-25>,
    "lifestyle_fit": <0-25>
  }
}

Be specific and honest. Reference actual listing details. Don't fabricate information.
"""


def _fit_label(score: int) -> str:
    if score >= 88:
        return "Excellent Match"
    if score >= 75:
        return "Strong Match"
    if score >= 62:
        return "Good Match"
    if score >= 48:
        return "Partial Match"
    return "Poor Match"


def analyze_fit(
    listing_id: str,
    user_profile: dict,
    demo_mode: bool = True,
) -> dict[str, Any]:
    """Generate fit analysis for a listing against a user profile."""
    listing = get_listing_by_id(listing_id, demo_mode)
    if not listing:
        return {"error": f"Listing {listing_id} not found"}

    # Check for cached artifact
    profile_id = user_profile.get("profile_id", "default")
    artifact_path = ARTIFACTS_DIR / profile_id / f"{listing_id}.json"
    if artifact_path.exists():
        return json.loads(artifact_path.read_text())

    llm = get_llm_client()

    listing_summary = {
        "address": listing.get("address"),
        "neighborhood": listing.get("neighborhood"),
        "price_monthly": listing.get("price_monthly"),
        "bedrooms": listing.get("bedrooms"),
        "sq_ft": listing.get("sq_ft"),
        "floor": listing.get("floor"),
        "amenities": listing.get("amenities"),
        "laundry": listing.get("laundry"),
        "doorman": listing.get("doorman"),
        "elevator": listing.get("elevator"),
        "pet_policy": listing.get("pet_policy"),
        "no_fee": listing.get("no_fee"),
        "description_snippet": listing.get("description_snippet"),
        "enrichment": listing.get("_enrichment", {}),
        "review_summary": listing.get("_review_summary", {}),
    }

    prompt = f"""
User Profile:
{json.dumps(user_profile, indent=2)}

Listing:
{json.dumps(listing_summary, indent=2)}

Generate a fit analysis for this listing given the user's requirements and preferences.
"""
    try:
        raw = llm.complete(system=FIT_ANALYSIS_SYSTEM, user=prompt, max_tokens=1200)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        analysis = json.loads(cleaned)
    except Exception as e:
        # Fallback: heuristic-based analysis
        score = _heuristic_fit_score(listing, user_profile)
        analysis = {
            "fit_score": score,
            "fit_label": _fit_label(score),
            "why_it_matches": _heuristic_pros(listing, user_profile),
            "tradeoffs": _heuristic_cons(listing, user_profile),
            "verdict": f"Score based on automated analysis. LLM unavailable: {e}",
            "score_breakdown": {
                "price_fit": min(25, max(0, 25 - abs((listing.get("price_monthly", 3000) - user_profile.get("budget_max", 3200)) // 100))),
                "location_fit": 18,
                "amenity_fit": 17,
                "lifestyle_fit": 15,
            },
        }

    analysis["listing_id"] = listing_id
    analysis["profile_id"] = profile_id

    # Cache the result
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS_DIR / profile_id).mkdir(exist_ok=True)
    artifact_path.write_text(json.dumps(analysis, indent=2))

    return analysis


def _heuristic_fit_score(listing: dict, profile: dict) -> int:
    score = 60
    budget = profile.get("budget_max", 3200)
    price = listing.get("price_monthly", 0)
    if price <= budget:
        score += 10
    elif price <= budget * 1.05:
        score += 3
    must_haves = profile.get("must_haves", [])
    amenities = [a.lower() for a in (listing.get("amenities") or [])]
    for mh in must_haves:
        if any(mh.lower() in a for a in amenities):
            score += 5
    if profile.get("weights", {}).get("commute", 0) > 0.2:
        enrich = listing.get("_enrichment", {})
        commute = enrich.get("commute_midtown_min")
        if commute and commute <= 15:
            score += 8
    return max(0, min(100, score))


def _heuristic_pros(listing: dict, profile: dict) -> list[str]:
    pros = []
    budget = profile.get("budget_max", 3200)
    price = listing.get("price_monthly", 0)
    if price <= budget:
        pros.append(f"Within budget by ${budget - price:,}")
    if listing.get("elevator"):
        pros.append("Building has elevator")
    if listing.get("doorman"):
        pros.append("24-hour doorman for security and convenience")
    enrich = listing.get("_enrichment", {})
    commute = enrich.get("commute_midtown_min")
    if commute and commute <= 18:
        pros.append(f"Strong Midtown commute (~{commute} min)")
    if not pros:
        pros.append("Located in preferred neighborhood area")
    return pros[:4]


def _heuristic_cons(listing: dict, profile: dict) -> list[str]:
    cons = []
    if listing.get("laundry") == "in_building":
        cons.append("Laundry is in-building, not in-unit")
    if not listing.get("doorman"):
        cons.append("No doorman — virtual or self-managed entry")
    review = listing.get("_review_summary", {})
    risk_flags = review.get("risk_flags", [])
    for flag in risk_flags[:2]:
        cons.append(f"{flag.get('type', 'Issue').title()} concern: {flag.get('evidence', '')[:80]}")
    if not cons:
        cons.append("Standard tradeoffs for this price point in LIC")
    return cons[:3]
