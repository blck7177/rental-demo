"""Review research service — building reputation research from multiple sources."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from src.services.llm_client import get_llm_client
from src.services.listing_service import get_listing_by_id

SEED_DIR = Path(__file__).parents[2] / "seed" / "lic_studio_demo"
ARTIFACTS_DIR = Path(__file__).parents[2] / "artifacts" / "review_research"

RESEARCH_SYSTEM = """
You are a NYC apartment research specialist. Your job is to synthesize building information
into a reputation intelligence report.

Given listing and enrichment data, produce a research report in JSON format:
{
  "building_name": "<name>",
  "overall_signal": "<very_positive | positive | mixed_positive | mixed | mixed_negative | negative>",
  "rating_snapshot": {
    "google_rating": <float or null>,
    "review_count": <int or null>
  },
  "positive_themes": [<list of 4-6 specific positive observations>],
  "negative_themes": [<list of 2-4 specific concerns>],
  "risk_flags": [
    {
      "type": "<management | noise | maintenance | security | construction | other>",
      "severity": "<low | medium | high>",
      "evidence": "<specific evidence>"
    }
  ],
  "neighborhood_notes": "<2-3 sentences about neighborhood quality and transit>",
  "research_notes": "<2-3 sentences overall summary and recommendation>"
}

Be specific and honest. Do not fabricate specific ratings or review counts unless provided.
"""


def get_review_research(listing_id: str, demo_mode: bool = True) -> Optional[dict]:
    """Get review research for a listing (from seed data or artifacts cache)."""
    # Check seed data first
    seed_file = SEED_DIR / "seed_reviews.json"
    if seed_file.exists():
        for rec in json.loads(seed_file.read_text()):
            if rec.get("listing_id") == listing_id:
                return rec

    # Check artifacts cache
    artifact_path = ARTIFACTS_DIR / f"{listing_id}.json"
    if artifact_path.exists():
        return json.loads(artifact_path.read_text())

    return None


def research_building(listing_id: str, demo_mode: bool = True) -> dict[str, Any]:
    """Research a building — returns cached data or generates new research."""
    # Return cached/seed if available
    existing = get_review_research(listing_id, demo_mode)
    if existing:
        return existing

    listing = get_listing_by_id(listing_id, demo_mode)
    if not listing:
        return {"error": f"Listing {listing_id} not found"}

    llm = get_llm_client()
    enrich = listing.get("_enrichment", {})

    prompt = f"""
Research this NYC apartment building:

Listing ID: {listing_id}
Address: {listing.get("address")}
Neighborhood: {listing.get("neighborhood")}
Borough: {listing.get("borough")}
Building Name: {enrich.get("building_name", "Unknown")}
Management Company: {enrich.get("management_company", "Unknown")}
Year Built: {enrich.get("year_built", "Unknown")}
Total Units: {enrich.get("total_units", "Unknown")}
Google Rating: {enrich.get("google_rating", "Unknown")} ({enrich.get("google_review_count", 0)} reviews)
Subway Lines: {enrich.get("subway_lines", [])}
Subway Walk: {enrich.get("subway_walk_min")} minutes
Commute to Midtown: {enrich.get("commute_midtown_min")} minutes
Neighborhood Vibe: {enrich.get("neighborhood_vibe", "Unknown")}
Description: {(listing.get("description_snippet") or "")[:300]}
Amenities: {listing.get("amenities", [])}

Generate a building reputation intelligence report.
"""

    try:
        raw = llm.complete(system=RESEARCH_SYSTEM, user=prompt, max_tokens=1500)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        research = json.loads(cleaned)
    except Exception as e:
        research = {
            "building_name": enrich.get("building_name", listing.get("address", "Unknown")),
            "overall_signal": "mixed",
            "rating_snapshot": {
                "google_rating": enrich.get("google_rating"),
                "review_count": enrich.get("google_review_count"),
            },
            "positive_themes": ["Located in Long Island City", "Access to NYC subway"],
            "negative_themes": ["Limited review data available"],
            "risk_flags": [],
            "neighborhood_notes": f"Located in {listing.get('neighborhood', 'LIC')}, Queens.",
            "research_notes": f"Automated research. LLM unavailable: {e}",
        }

    research["listing_id"] = listing_id
    research["review_summary_id"] = f"rev_{listing_id}"

    # Cache result
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS_DIR / f"{listing_id}.json").write_text(json.dumps(research, indent=2))

    return research
