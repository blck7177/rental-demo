"""Run import service — merge nyc-rentals-openclaw listings into rental-demo db."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Optional

from src.services.openclaw_service import get_openclaw_listings

DB_DIR = Path(__file__).parents[2] / "db"


def _ensure_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    listings_file = DB_DIR / "listings.jsonl"
    index_file = DB_DIR / "listing_index.json"
    if not listings_file.exists():
        listings_file.touch()
    if not index_file.exists():
        index_file.write_text("{}\n")


def _load_index() -> dict[str, str]:
    _ensure_db()
    try:
        return json.loads((DB_DIR / "listing_index.json").read_text())
    except Exception:
        return {}


def _save_index(index: dict[str, str]) -> None:
    (DB_DIR / "listing_index.json").write_text(json.dumps(index, indent=2) + "\n")


def import_from_openclaw(run_id: Optional[str] = None) -> dict[str, Any]:
    """Import listings from nyc-rentals-openclaw into rental-demo db."""
    _ensure_db()
    index = _load_index()
    listings_file = DB_DIR / "listings.jsonl"

    source_listings = get_openclaw_listings()
    if not source_listings:
        return {"imported": 0, "skipped": 0, "total_source": 0,
                "message": "No listings found in nyc-rentals-openclaw db"}

    if run_id:
        source_listings = [l for l in source_listings if l.get("run_id") == run_id]

    imported = 0
    skipped = 0

    with listings_file.open("a", encoding="utf-8") as f:
        for listing in source_listings:
            url = listing.get("url", "")
            if not url:
                skipped += 1
                continue
            url_h = hashlib.sha256(url.encode()).hexdigest()
            if url_h in index:
                skipped += 1
                continue
            f.write(json.dumps(listing) + "\n")
            index[url_h] = listing.get("listing_id", url_h[:16])
            imported += 1

    _save_index(index)

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "total_source": len(source_listings),
        "run_id": run_id,
        "message": f"Imported {imported} new listings ({skipped} duplicates skipped)",
    }
