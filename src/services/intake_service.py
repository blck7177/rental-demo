"""Intake service — parses natural language requirements into structured user profiles."""

from __future__ import annotations

import json
import re
import uuid
from pathlib import Path
from typing import Any

from src.services.llm_client import get_llm_client

DB_DIR = Path(__file__).parents[2] / "db"

INTAKE_SYSTEM = """
You are an NYC rental assistant helping a client define their apartment search requirements.

Parse the user's natural language input and structured form data into a user profile JSON:
{
  "profile_id": "<keep existing or generate new uuid>",
  "name": "<user name if provided, else 'Demo User'>",
  "budget_max": <integer, max monthly rent>,
  "budget_min": <integer or null>,
  "neighborhoods": [<list of preferred neighborhood names>],
  "boroughs": [<list: Manhattan | Brooklyn | Queens | Bronx | Staten Island>],
  "bedrooms": <number, 0=studio>,
  "must_haves": [<list: "elevator", "doorman", "laundry_in_unit", "gym", "no_fee", etc.>],
  "nice_to_haves": [<list of preferred but not required features>],
  "avoid": [<list: "bad_management", "noise", "no_laundry", "no_elevator", etc.>],
  "pet": <boolean>,
  "weights": {
    "price": <0.0-1.0>,
    "commute": <0.0-1.0>,
    "building_quality": <0.0-1.0>,
    "amenities": <0.0-1.0>
  },
  "commute_destination": "<Midtown | Downtown | Other neighborhood>",
  "move_in_by": "<YYYY-MM-DD or null>",
  "notes": "<any additional preferences not captured above>"
}

Rules:
- weights must sum to approximately 1.0
- Infer weights from language emphasis (e.g. "care about commute" → commute weight 0.3+)
- neighborhoods should be specific NYC neighborhoods (e.g. "Long Island City" not just "Queens")
- Return ONLY the JSON object
"""


def parse_intake(
    nl_text: str,
    form_data: dict | None = None,
    existing_profile_id: str | None = None,
) -> dict[str, Any]:
    """Parse natural language + form data into a user profile."""
    llm = get_llm_client()

    profile_id = existing_profile_id or f"profile_{uuid.uuid4().hex[:12]}"

    form_str = ""
    if form_data:
        form_str = f"\n\nStructured form data provided:\n{json.dumps(form_data, indent=2)}"

    prompt = f"""
Profile ID to use: {profile_id}

User's natural language input:
"{nl_text}"
{form_str}

Parse this into a complete user profile JSON.
"""

    try:
        raw = llm.complete(system=INTAKE_SYSTEM, user=prompt, max_tokens=1000)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        profile = json.loads(cleaned)
    except Exception as e:
        # Fallback heuristic profile
        profile = _heuristic_profile(nl_text, form_data, profile_id, str(e))

    profile["profile_id"] = profile_id

    # Save to db
    DB_DIR.mkdir(parents=True, exist_ok=True)
    profiles_file = DB_DIR / "user_profiles.jsonl"
    with profiles_file.open("a") as f:
        f.write(json.dumps(profile) + "\n")

    return profile


def _heuristic_profile(text: str, form_data: dict | None, profile_id: str, error: str) -> dict:
    text_lower = text.lower()
    budget = 3200
    # Try to extract a dollar amount
    import re as re_
    amounts = re_.findall(r"\$?([\d,]+)", text)
    for a in amounts:
        try:
            v = int(a.replace(",", ""))
            if 1000 <= v <= 15000:
                budget = v
                break
        except ValueError:
            pass

    neighborhoods = []
    for n in ["long island city", "lic", "hunters point", "dutch kills", "queensboro plaza", "astoria", "sunnyside"]:
        if n in text_lower:
            neighborhoods.append(n.title())

    return {
        "profile_id": profile_id,
        "name": "Demo User",
        "budget_max": budget,
        "budget_min": None,
        "neighborhoods": neighborhoods or ["Long Island City"],
        "boroughs": ["Queens"],
        "bedrooms": 0,
        "must_haves": ["elevator"] if "elevator" in text_lower else [],
        "nice_to_haves": ["laundry_in_unit"] if "laundry" in text_lower else [],
        "avoid": ["bad_management"] if "management" in text_lower else [],
        "pet": "pet" in text_lower,
        "weights": {"price": 0.25, "commute": 0.3, "building_quality": 0.25, "amenities": 0.2},
        "commute_destination": "Midtown",
        "move_in_by": None,
        "notes": f"Heuristic profile. LLM unavailable: {error}",
    }


def get_latest_profile() -> dict | None:
    """Get the most recently created user profile."""
    profiles_file = DB_DIR / "user_profiles.jsonl"
    if not profiles_file.exists():
        return None
    lines = [l.strip() for l in profiles_file.read_text().splitlines() if l.strip()]
    if not lines:
        return None
    try:
        return json.loads(lines[-1])
    except Exception:
        return None


DEFAULT_DEMO_PROFILE = {
    "profile_id": "demo_profile_lic_001",
    "name": "Demo User",
    "budget_max": 3200,
    "budget_min": None,
    "neighborhoods": ["Long Island City", "Hunters Point", "Dutch Kills"],
    "boroughs": ["Queens"],
    "bedrooms": 0,
    "must_haves": ["elevator"],
    "nice_to_haves": ["laundry_in_unit", "gym", "doorman"],
    "avoid": ["bad_management", "noise"],
    "pet": False,
    "weights": {"price": 0.25, "commute": 0.3, "building_quality": 0.25, "amenities": 0.2},
    "commute_destination": "Midtown",
    "move_in_by": None,
    "notes": "Looking for a quiet studio with good commute to Midtown. Prefer buildings with professional management.",
}
