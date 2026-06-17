"""JSONL storage — append-only listings db with URL dedup index."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional


def _db_dir() -> Path:
    return Path(__file__).parents[2] / "db"


def _listings_file() -> Path:
    return _db_dir() / "listings.jsonl"


def _index_file() -> Path:
    return _db_dir() / "listing_index.json"


def _ensure_db() -> None:
    _db_dir().mkdir(parents=True, exist_ok=True)
    if not _listings_file().exists():
        _listings_file().touch()
    if not _index_file().exists():
        _index_file().write_text("{}\n")


def load_index() -> dict[str, str]:
    _ensure_db()
    try:
        return json.loads(_index_file().read_text())
    except json.JSONDecodeError:
        return {}


def save_index(index: dict[str, str]) -> None:
    _ensure_db()
    _index_file().write_text(json.dumps(index, indent=2) + "\n")


def append_listing(record: dict) -> None:
    _ensure_db()
    with _listings_file().open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")
    index = load_index()
    import hashlib
    h = hashlib.sha256(record["url"].encode()).hexdigest()
    index[h] = record["listing_id"]
    save_index(index)


def read_all_listings() -> list[dict]:
    _ensure_db()
    records = []
    text = _listings_file().read_text(encoding="utf-8")
    for line in text.splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return records


def query_listings(
    neighborhood: Optional[str] = None,
    borough: Optional[str] = None,
    max_rent: Optional[int] = None,
    min_rent: Optional[int] = None,
    bedrooms: Optional[float] = None,
    no_fee: Optional[bool] = None,
    doorman: Optional[bool] = None,
    laundry: Optional[str] = None,
    elevator: Optional[bool] = None,
    pets: Optional[bool] = None,
    status: str = "active",
) -> list[dict]:
    """Query listings with optional filters."""
    records = read_all_listings()
    results = []
    for r in records:
        if status and r.get("status", "active") != status:
            continue
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
        if no_fee is not None and r.get("no_fee") != no_fee:
            continue
        if doorman is not None and r.get("doorman") != doorman:
            continue
        if elevator is not None and r.get("elevator") != elevator:
            continue
        if laundry is not None and r.get("laundry") != laundry:
            continue
        if pets is True:
            pet = r.get("pet_policy") or ""
            if pet in ("no_pets",):
                continue
        results.append(r)
    return results
