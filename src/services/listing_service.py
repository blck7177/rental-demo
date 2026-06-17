"""Listing service — loads from JSONL db + seed data, merges enrichments."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from src.pipeline.storage import read_all_listings, query_listings as _query_listings

SEED_DIR = Path(__file__).parents[2] / "seed" / "lic_studio_demo"
DB_DIR = Path(__file__).parents[2] / "db"


def _load_seed_listings() -> list[dict]:
    seed_file = SEED_DIR / "seed_listings.json"
    if seed_file.exists():
        return json.loads(seed_file.read_text())
    return []


def _load_enrichments() -> dict[str, dict]:
    """Return map of listing_id -> enrichment record."""
    result: dict[str, dict] = {}
    # Load from db/ first
    enrich_file = DB_DIR / "listing_enrichments.jsonl"
    if enrich_file.exists():
        for line in enrich_file.read_text().splitlines():
            line = line.strip()
            if line:
                try:
                    rec = json.loads(line)
                    result[rec["listing_id"]] = rec
                except Exception:
                    pass
    # Overlay seed enrichments (seed takes precedence for demo)
    seed_enrich_file = SEED_DIR / "seed_enrichments.json"
    if seed_enrich_file.exists():
        for rec in json.loads(seed_enrich_file.read_text()):
            result[rec["listing_id"]] = rec
    return result


def _load_reviews() -> dict[str, dict]:
    """Return map of listing_id -> review summary."""
    result: dict[str, dict] = {}
    seed_reviews_file = SEED_DIR / "seed_reviews.json"
    if seed_reviews_file.exists():
        for rec in json.loads(seed_reviews_file.read_text()):
            result[rec["listing_id"]] = rec
    reviews_file = DB_DIR / "listing_reviews.jsonl"
    if reviews_file.exists():
        for line in reviews_file.read_text().splitlines():
            line = line.strip()
            if line:
                try:
                    rec = json.loads(line)
                    result[rec["listing_id"]] = rec
                except Exception:
                    pass
    return result


def get_all_listings(demo_mode: bool = True) -> list[dict]:
    """Return all listings, merged with enrichments."""
    if demo_mode:
        listings = _load_seed_listings()
    else:
        listings = read_all_listings()
        if not listings:
            listings = _load_seed_listings()

    enrichments = _load_enrichments()
    reviews = _load_reviews()
    result = []
    for l in listings:
        lid = l.get("listing_id", "")
        enriched = dict(l)
        if lid in enrichments:
            enriched["_enrichment"] = enrichments[lid]
        if lid in reviews:
            enriched["_review_summary"] = {
                "overall_signal": reviews[lid].get("overall_signal"),
                "google_rating": reviews[lid].get("rating_snapshot", {}).get("google_rating"),
                "risk_flags": reviews[lid].get("risk_flags", []),
            }
        result.append(enriched)
    return result


def get_listing_by_id(listing_id: str, demo_mode: bool = True) -> Optional[dict]:
    all_listings = get_all_listings(demo_mode)
    for l in all_listings:
        if l.get("listing_id") == listing_id:
            return l
    return None


def filter_listings(
    listings: list[dict],
    neighborhood: Optional[str] = None,
    borough: Optional[str] = None,
    max_rent: Optional[int] = None,
    min_rent: Optional[int] = None,
    bedrooms: Optional[float] = None,
    no_fee: Optional[bool] = None,
    doorman: Optional[bool] = None,
    elevator: Optional[bool] = None,
    laundry: Optional[str] = None,
    pets: Optional[bool] = None,
    amenities: Optional[list[str]] = None,
) -> list[dict]:
    results = []
    for r in listings:
        if neighborhood and neighborhood.lower() not in (r.get("neighborhood") or "").lower():
            continue
        if borough and r.get("borough") != borough:
            continue
        if max_rent and (r.get("price_monthly") or 0) > max_rent:
            continue
        if min_rent and (r.get("price_monthly") or 0) < min_rent:
            continue
        if bedrooms is not None and r.get("bedrooms") != bedrooms:
            continue
        if no_fee is True and not r.get("no_fee"):
            continue
        if doorman is True and not r.get("doorman"):
            continue
        if elevator is True and not r.get("elevator"):
            continue
        if laundry and r.get("laundry") != laundry:
            continue
        if pets is True:
            pet = r.get("pet_policy") or ""
            if pet in ("no_pets",):
                continue
        if amenities:
            listing_amenities = [a.lower() for a in (r.get("amenities") or [])]
            for req in amenities:
                if not any(req.lower() in a for a in listing_amenities):
                    break
            else:
                results.append(r)
                continue
            continue
        results.append(r)
    return results
