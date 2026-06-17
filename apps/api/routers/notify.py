"""Notify router — WeCom/WeChat shortlist push."""

from __future__ import annotations

import json
import os
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from src.services.listing_service import get_listing_by_id

router = APIRouter()


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


class NotifyRequest(BaseModel):
    listing_ids: list[str]
    profile_name: str = "Demo User"
    demo_link: Optional[str] = "http://localhost:3000"
    send_to_wecom: bool = False


def _build_message(listings: list[dict], profile_name: str, demo_link: str) -> str:
    lines = [f"🏠 NYC Studio Shortlist for {profile_name}\n"]
    for i, l in enumerate(listings, 1):
        enrich = l.get("_enrichment", {})
        review = l.get("_review_summary", {})
        building = enrich.get("building_name") or l.get("address", "Unknown Building")
        price = l.get("price_monthly", 0)
        neighborhood = l.get("neighborhood", "LIC")
        commute = enrich.get("commute_midtown_min")
        commute_str = f"{commute} min to Midtown" if commute else "Commute: N/A"
        laundry = l.get("laundry", "unknown")
        laundry_label = {"in_unit": "In-unit laundry", "in_building": "Building laundry"}.get(laundry, laundry)

        # Risk signal
        risk_flags = review.get("risk_flags", [])
        concern = ""
        if risk_flags:
            first = risk_flags[0]
            concern = f"\n⚠️ Concern: {first.get('evidence', '')[:60]}"

        lines.append(
            f"{i}. {building} — {neighborhood}\n"
            f"   💰 ${price:,}/mo | 🚇 {commute_str}\n"
            f"   🏘️ {laundry_label}{concern}"
        )

    lines.append(f"\n🔗 Full comparison: {demo_link}/compare")
    return "\n".join(lines)


@router.post("/notify/wecom")
async def notify_wecom(req: NotifyRequest):
    """Generate a WeCom-style shortlist message and optionally send via webhook."""
    demo = _demo_mode()
    listings = []
    for lid in req.listing_ids:
        l = get_listing_by_id(lid, demo_mode=demo)
        if l:
            listings.append(l)

    if not listings:
        return {"error": "No valid listings found"}

    message = _build_message(listings, req.profile_name, req.demo_link or "http://localhost:3000")
    
    wecom_payload = {
        "msgtype": "text",
        "text": {
            "content": message,
        },
    }

    sent = False
    send_error = None

    if req.send_to_wecom:
        webhook_url = os.getenv("WECOM_WEBHOOK_URL", "")
        if webhook_url and "YOUR_KEY" not in webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        webhook_url,
                        json=wecom_payload,
                        timeout=10,
                    )
                    sent = resp.status_code == 200
                    if not sent:
                        send_error = f"HTTP {resp.status_code}: {resp.text[:100]}"
            except Exception as e:
                send_error = str(e)
        else:
            send_error = "WECOM_WEBHOOK_URL not configured"

    return {
        "message_preview": message,
        "wecom_payload": wecom_payload,
        "sent": sent,
        "send_error": send_error,
        "listing_count": len(listings),
    }
