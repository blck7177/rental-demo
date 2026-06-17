"""Natural language query service — LLM translates NL to structured filters + ranking."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from src.services.llm_client import get_llm_client
from src.services.listing_service import get_all_listings, filter_listings

NL_TRANSLATE_SYSTEM = """
You are an NYC rental search assistant. Your job is to parse natural language rental queries
into structured filter parameters and ranking preferences.

Return ONLY valid JSON with this exact structure:
{
  "filters": {
    "max_rent": <integer or null>,
    "min_rent": <integer or null>,
    "bedrooms": <number or null, 0=studio>,
    "neighborhood": <string or null>,
    "borough": <string or null, one of: Manhattan, Brooklyn, Queens, Bronx, Staten Island>,
    "no_fee": <boolean or null>,
    "doorman": <boolean or null>,
    "elevator": <boolean or null>,
    "laundry": <"in_unit" | "in_building" | null>,
    "pets": <boolean or null>
  },
  "ranking_intent": {
    "priorities": [<list of strings: "price", "commute", "quiet", "amenities", "no_fee", "pet_friendly", "laundry">],
    "avoid": [<list of strings: "noise", "bad_management", "no_laundry", "no_elevator">]
  },
  "parsed_summary": "<1-2 sentence human-readable summary of what was parsed>"
}

Rules:
- Only set filters when clearly stated or strongly implied
- "studio" or "1 person" implies bedrooms=0
- "under $X" or "max $X" sets max_rent
- "no fee" or "no broker fee" sets no_fee=true
- Return null for any field not mentioned
"""


def translate_nl_query(nl_query: str) -> dict[str, Any]:
    """Translate natural language query to structured filters."""
    llm = get_llm_client()
    prompt = f'Parse this NYC rental search query:\n\n"{nl_query}"'
    
    try:
        raw = llm.complete(system=NL_TRANSLATE_SYSTEM, user=prompt, max_tokens=800)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        return json.loads(cleaned)
    except Exception as e:
        return {
            "filters": {},
            "ranking_intent": {"priorities": [], "avoid": []},
            "parsed_summary": f"Could not parse query: {e}",
            "_error": str(e),
        }


def score_listing(listing: dict, ranking_intent: dict, filters: dict) -> int:
    """Score a listing 0-100 based on ranking intent and how well it matches."""
    score = 60  # baseline

    priorities = ranking_intent.get("priorities", [])
    avoid = ranking_intent.get("avoid", [])
    amenities = [a.lower() for a in (listing.get("amenities") or [])]

    # Price efficiency (0-20 pts)
    max_rent = filters.get("max_rent")
    if max_rent and listing.get("price_monthly"):
        price = listing["price_monthly"]
        if price <= max_rent * 0.9:
            score += 10
        elif price <= max_rent:
            score += 5

    # Priority bonuses
    if "commute" in priorities:
        enrich = listing.get("_enrichment", {})
        commute = enrich.get("commute_midtown_min")
        if commute and commute <= 15:
            score += 10
        elif commute and commute <= 20:
            score += 5

    if "quiet" in priorities:
        # Garden/high floors tend to be quieter
        floor = listing.get("floor") or 0
        if floor >= 8:
            score += 5
        # No Queens Blvd / major intersection → quieter
        addr = (listing.get("address") or "").lower()
        if "queens blvd" not in addr and "northern blvd" not in addr:
            score += 3
        # Check review risk flags
        review = listing.get("_review_summary", {})
        risk_flags = review.get("risk_flags", [])
        if any(f.get("type") == "noise" for f in risk_flags):
            score -= 8

    if "amenities" in priorities:
        if listing.get("doorman"):
            score += 3
        if listing.get("elevator"):
            score += 2
        if any("gym" in a for a in amenities):
            score += 3
        if any("pool" in a for a in amenities):
            score += 3

    if "no_fee" in priorities and listing.get("no_fee"):
        score += 8

    if "pet_friendly" in priorities:
        pet = listing.get("pet_policy") or "unknown"
        if pet in ("pets_allowed", "dogs_ok"):
            score += 6
        elif pet in ("cats_only", "dogs_ok_small"):
            score += 3

    if "laundry" in priorities:
        laundry = listing.get("laundry")
        if laundry == "in_unit":
            score += 8
        elif laundry == "in_building":
            score += 4

    # Avoid penalties
    if "bad_management" in avoid:
        review = listing.get("_review_summary", {})
        risk_flags = review.get("risk_flags", [])
        if any(f.get("type") == "management" and f.get("severity") == "high" for f in risk_flags):
            score -= 15
        elif any(f.get("type") == "management" for f in risk_flags):
            score -= 5

    if "noise" in avoid:
        review = listing.get("_review_summary", {})
        risk_flags = review.get("risk_flags", [])
        if any(f.get("type") == "noise" for f in risk_flags):
            score -= 8

    # Quality tier adjustment
    qt = listing.get("quality_tier", "medium")
    if qt == "high":
        score += 5
    elif qt == "low":
        score -= 5

    return max(0, min(100, score))


def nl_search(nl_query: str, demo_mode: bool = True) -> dict[str, Any]:
    """Full NL search pipeline: parse → filter → score → rank."""
    parsed = translate_nl_query(nl_query)
    filters = parsed.get("filters", {})
    ranking_intent = parsed.get("ranking_intent", {})

    all_listings = get_all_listings(demo_mode)
    filtered = filter_listings(
        all_listings,
        neighborhood=filters.get("neighborhood"),
        borough=filters.get("borough"),
        max_rent=filters.get("max_rent"),
        min_rent=filters.get("min_rent"),
        bedrooms=filters.get("bedrooms"),
        no_fee=filters.get("no_fee"),
        doorman=filters.get("doorman"),
        elevator=filters.get("elevator"),
        laundry=filters.get("laundry"),
        pets=filters.get("pets"),
    )

    # Score and rank
    scored = []
    for listing in filtered:
        fit_score = score_listing(listing, ranking_intent, filters)
        scored.append({**listing, "_fit_score": fit_score})
    scored.sort(key=lambda x: x["_fit_score"], reverse=True)

    return {
        "query": nl_query,
        "parsed": parsed,
        "total_results": len(scored),
        "results": scored,
    }
