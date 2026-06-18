"""FastAPI main application — NYC Rental Intelligence Demo API."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parents[2] / ".env")

from apps.api.routers import listings, query, analysis, research, runs, notify, intake, clients, agent, feedback

app = FastAPI(
    title="NYC Rental Intelligence Demo API",
    description="AI-powered rental workflow: search → structure → analyze → compare → push",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/api", tags=["intake"])
app.include_router(listings.router, prefix="/api", tags=["listings"])
app.include_router(query.router, prefix="/api", tags=["query"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(research.router, prefix="/api", tags=["research"])
app.include_router(runs.router, prefix="/api", tags=["runs"])
app.include_router(notify.router, prefix="/api", tags=["notify"])
app.include_router(clients.router, prefix="/api", tags=["clients"])
app.include_router(agent.router, prefix="/api", tags=["agent"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])


@app.get("/")
def root():
    return {
        "service": "NYC Rental Intelligence Demo",
        "version": "0.1.0",
        "demo_mode": os.getenv("DEMO_MODE", "true").lower() == "true",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
