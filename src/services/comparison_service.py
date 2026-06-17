"""Comparison service — generates side-by-side listing comparisons with AI verdict."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from src.services.llm_client import get_llm_client
from src.services.listing_service import get_listing_by_id

ARTIFACTS_DIR = Path(__file__).parents[2] / "artifacts" / "comparison_reports"

COMPARE_SYSTEM = """
You are a NYC rental advisor helping a client compare multiple apartment listings.

Given 2-3 listings and a user profile, produce a comparison in JSON format:
{
  "summary": "<2-3 sentence overview of the comparison>",
  "verdicts": {
    "best_overall": "<listing_id>",
    "best_value": "<listing_id>",
    "lowest_risk": "<listing_id>",
    "best_commute": "<listing_id or null>",
    "best_amenities": "<listing_id>"
  },
  "verdict_explanations": {
    "best_overall": "<why>",
    "best_value": "<why>",
    "lowest_risk": "<why>"
  },
  "comparison_rows": [
    {
      "category": "<category name>",
      "values": {"<listing_id>": "<value>", ...},
      "winner": "<listing_id or null>"
    }
  ],
  "bottom_line": "<1-2 sentence final recommendation tailored to user profile>"
}

Include these comparison_rows categories:
- Monthly Rent
- Neighborhood  
- Subway Access
- Commute to Midtown
- Laundry
- Doorman
- Elevator
- Pet Policy
- Key Amenities
- Management Risk
- Overall Signal
"""


def compare_listings(
    listing_ids: list[str],
    user_profile: dict,
    demo_mode: bool = True,
) -> dict[str, Any]:
    """Generate side-by-side comparison for 2-3 listings."""
    if len(listing_ids) < 2 or len(listing_ids) > 3:
        return {"error": "Please select 2–3 listings to compare"}

    listings = []
    for lid in listing_ids:
        l = get_listing_by_id(lid, demo_mode)
        if l:
            listings.append(l)
        else:
            return {"error": f"Listing {lid} not found"}

    llm = get_llm_client()

    listings_data = []
    for l in listings:
        enrich = l.get("_enrichment", {})
        review = l.get("_review_summary", {})
        listings_data.append({
            "listing_id": l["listing_id"],
            "address": l.get("address"),
            "neighborhood": l.get("neighborhood"),
            "price_monthly": l.get("price_monthly"),
            "sq_ft": l.get("sq_ft"),
            "floor": l.get("floor"),
            "laundry": l.get("laundry"),
            "doorman": l.get("doorman"),
            "elevator": l.get("elevator"),
            "pet_policy": l.get("pet_policy"),
            "no_fee": l.get("no_fee"),
            "amenities": l.get("amenities", [])[:6],
            "description_snippet": (l.get("description_snippet") or "")[:200],
            "subway_lines": enrich.get("subway_lines", []),
            "subway_walk_min": enrich.get("subway_walk_min"),
            "commute_midtown_min": enrich.get("commute_midtown_min"),
            "building_name": enrich.get("building_name"),
            "management_company": enrich.get("management_company"),
            "google_rating": review.get("google_rating"),
            "overall_signal": review.get("overall_signal"),
            "risk_flags": review.get("risk_flags", []),
        })

    prompt = f"""
User Profile:
{json.dumps(user_profile, indent=2)}

Listings to Compare:
{json.dumps(listings_data, indent=2)}

Generate a detailed comparison with verdicts and bottom-line recommendation.
"""

    try:
        raw = llm.complete(system=COMPARE_SYSTEM, user=prompt, max_tokens=2000)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        comparison = json.loads(cleaned)
    except Exception as e:
        comparison = _fallback_comparison(listings_data, user_profile, str(e))

    comparison["listing_ids"] = listing_ids
    comparison["listings"] = listings_data

    # Cache result
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    key = "_".join(sorted(listing_ids))[:40]
    (ARTIFACTS_DIR / f"{key}.json").write_text(json.dumps(comparison, indent=2))

    return comparison


def _fallback_comparison(listings_data: list[dict], profile: dict, error: str) -> dict:
    by_price = sorted(listings_data, key=lambda x: x.get("price_monthly", 9999))
    by_commute = sorted(listings_data, key=lambda x: x.get("commute_midtown_min") or 99)

    cheapest = by_price[0]["listing_id"]
    fastest_commute = by_commute[0]["listing_id"]

    rows = []
    for cat, key in [
        ("Monthly Rent", "price_monthly"),
        ("Neighborhood", "neighborhood"),
        ("Commute to Midtown", "commute_midtown_min"),
        ("Laundry", "laundry"),
        ("Doorman", "doorman"),
        ("Elevator", "elevator"),
        ("Pet Policy", "pet_policy"),
        ("Google Rating", "google_rating"),
    ]:
        values = {}
        for l in listings_data:
            v = l.get(key)
            if key == "price_monthly" and v:
                values[l["listing_id"]] = f"${v:,}/mo"
            elif key == "commute_midtown_min" and v:
                values[l["listing_id"]] = f"~{v} min"
            elif isinstance(v, bool):
                values[l["listing_id"]] = "Yes" if v else "No"
            elif v is not None:
                values[l["listing_id"]] = str(v)
            else:
                values[l["listing_id"]] = "N/A"
        rows.append({"category": cat, "values": values, "winner": None})

    return {
        "summary": f"Automated comparison of {len(listings_data)} listings. LLM unavailable: {error}",
        "verdicts": {
            "best_overall": listings_data[0]["listing_id"],
            "best_value": cheapest,
            "lowest_risk": listings_data[0]["listing_id"],
            "best_commute": fastest_commute,
            "best_amenities": listings_data[0]["listing_id"],
        },
        "verdict_explanations": {
            "best_overall": "First listing by default (LLM analysis unavailable)",
            "best_value": f"Lowest monthly rent at ${by_price[0].get('price_monthly', 0):,}",
            "lowest_risk": "Based on available review data",
        },
        "comparison_rows": rows,
        "bottom_line": "Please configure an LLM API key for personalized recommendation.",
    }
