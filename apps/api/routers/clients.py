"""Clients router — manages agent client profiles and shortlists.

Endpoints:
  GET  /api/clients                  list all clients
  POST /api/clients                  create new client
  GET  /api/clients/{client_id}      get single client (with shortlist summary)
  PATCH /api/clients/{client_id}     update client fields
  POST /api/clients/{client_id}/notes    append a note
  GET  /api/clients/{client_id}/shortlist  list shortlist entries
  POST /api/clients/{client_id}/shortlist  add listing to shortlist
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services.client_service import (
    list_clients,
    get_client,
    create_client,
    update_client,
    append_client_note,
    get_client_shortlist,
    add_to_shortlist,
    get_client_summary,
)

router = APIRouter()


# ---------- request models ----------

class CreateClientRequest(BaseModel):
    name: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    neighborhoods: Optional[list[str]] = None
    move_in: Optional[str] = None
    channel: str = "wechat"
    notes: Optional[list[str]] = None
    must_haves: Optional[list[str]] = None
    avoid: Optional[list[str]] = None
    weights: Optional[dict[str, float]] = None


class UpdateClientRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    neighborhoods: Optional[list[str]] = None
    move_in: Optional[str] = None
    channel: Optional[str] = None
    must_haves: Optional[list[str]] = None
    avoid: Optional[list[str]] = None
    weights: Optional[dict[str, float]] = None


class AppendNoteRequest(BaseModel):
    note: str


class ShortlistAddRequest(BaseModel):
    listing_id: str
    status: str = "saved"
    feedback: Optional[str] = None


# ---------- routes ----------

@router.get("/clients")
def get_clients():
    """Return all clients (demo client always first)."""
    return {"clients": list_clients()}


@router.post("/clients")
def create_new_client(req: CreateClientRequest):
    """Create a new client profile."""
    client = create_client(
        name=req.name,
        budget_min=req.budget_min,
        budget_max=req.budget_max,
        neighborhoods=req.neighborhoods,
        move_in=req.move_in,
        channel=req.channel,
        notes=req.notes,
        must_haves=req.must_haves,
        avoid=req.avoid,
        weights=req.weights,
    )
    return {"client": client, "status": "created"}


@router.get("/clients/{client_id}")
def get_single_client(client_id: str):
    """Get a single client with computed shortlist summary."""
    summary = get_client_summary(client_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    return {"client": summary}


@router.patch("/clients/{client_id}")
def patch_client(client_id: str, req: UpdateClientRequest):
    """Update client fields (partial update)."""
    updates = req.model_dump(exclude_none=True)
    if "budget_min" in updates or "budget_max" in updates:
        existing = get_client(client_id) or {}
        existing_budget = existing.get("budget") or {}
        updates["budget"] = {
            "min": updates.pop("budget_min", existing_budget.get("min")),
            "max": updates.pop("budget_max", existing_budget.get("max")),
        }
    client = update_client(client_id, updates)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    return {"client": client, "status": "updated"}


@router.post("/clients/{client_id}/notes")
def add_note(client_id: str, req: AppendNoteRequest):
    """Append a note to a client's notes list."""
    client = append_client_note(client_id, req.note)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    return {"client": client, "status": "note_added"}


@router.get("/clients/{client_id}/shortlist")
def get_shortlist(client_id: str):
    """Return all shortlist entries for a client."""
    entries = get_client_shortlist(client_id)
    return {"client_id": client_id, "shortlist": entries, "count": len(entries)}


@router.post("/clients/{client_id}/shortlist")
def add_shortlist_entry(client_id: str, req: ShortlistAddRequest):
    """Add a listing to a client's shortlist."""
    if not get_client(client_id):
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    entry = add_to_shortlist(
        client_id=client_id,
        listing_id=req.listing_id,
        status=req.status,
        feedback=req.feedback,
    )
    return {"entry": entry, "status": "added"}
