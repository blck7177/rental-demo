"""Query router — POST /api/query/nl."""

from __future__ import annotations

import os

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.query_service import nl_search

router = APIRouter()


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


class NLQueryRequest(BaseModel):
    query: str


@router.post("/query/nl")
def natural_language_query(req: NLQueryRequest):
    """Translate natural language query to structured search, return ranked results."""
    results = nl_search(req.query, demo_mode=_demo_mode())
    return results
