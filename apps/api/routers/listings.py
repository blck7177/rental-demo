"""Listings router — GET /api/listings, GET /api/listings/{id}."""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Query

from src.services.listing_service import get_all_listings, get_listing_by_id, filter_listings

router = APIRouter()


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


@router.get("/listings")
def list_listings(
    neighborhood: Optional[str] = Query(None),
    borough: Optional[str] = Query(None),
    max_rent: Optional[int] = Query(None),
    min_rent: Optional[int] = Query(None),
    bedrooms: Optional[float] = Query(None),
    no_fee: Optional[bool] = Query(None),
    doorman: Optional[bool] = Query(None),
    elevator: Optional[bool] = Query(None),
    laundry: Optional[str] = Query(None),
    pets: Optional[bool] = Query(None),
    sort_by: str = Query("price_monthly"),
    order: str = Query("asc"),
):
    """List all listings with optional filters."""
    all_listings = get_all_listings(demo_mode=_demo_mode())
    filtered = filter_listings(
        all_listings,
        neighborhood=neighborhood,
        borough=borough,
        max_rent=max_rent,
        min_rent=min_rent,
        bedrooms=bedrooms,
        no_fee=no_fee,
        doorman=doorman,
        elevator=elevator,
        laundry=laundry,
        pets=pets,
    )

    # Sort
    reverse = order.lower() == "desc"
    try:
        filtered.sort(key=lambda x: (x.get(sort_by) is None, x.get(sort_by) or 0), reverse=reverse)
    except Exception:
        pass

    return {
        "total": len(filtered),
        "listings": filtered,
    }


@router.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    """Get a single listing by ID."""
    listing = get_listing_by_id(listing_id, demo_mode=_demo_mode())
    if not listing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found")
    return listing
