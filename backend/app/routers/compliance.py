"""Compliance router — RAG-powered license checklist.

Replaces the static hardcoded dict with a RAG pipeline that retrieves
context from ChromaDB and synthesises a hyper-local, region-aware list
via OpenAI.  Falls back gracefully to the hardcoded rules on any error.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.compliance import LicenseItem
from app.services.rag.compliance_rag import get_compliance_checklist

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.get("/licenses", summary="Get compliance checklist (RAG-powered)")
async def licenses(
    business_category: str = Query(..., description="dairy, retail, food, electronics ..."),
    state: str = Query("", description="Indian state for regional rules (e.g. Bihar)"),
    district: str = Query("", description="District for hyper-local rules (e.g. Nalanda)"),
) -> dict:
    """Return a compliance and licensing checklist for the given business type.

    When OpenAI and ChromaDB are available, returns a region-aware checklist
    enriched with context from government guidelines.
    Falls back to static rules if either service is unavailable.

    New response fields (vs MVP):
    - ``sources``: list of knowledge document names used
    - ``ai_generated``: boolean — ``true`` when OpenAI was used
    - ``confidence``: float 0–1 (cosine similarity score of retrieved context)
    """
    result = await get_compliance_checklist(
        business_category=business_category,
        state=state,
        district=district,
    )

    # Normalise license items through the Pydantic schema for validation
    normalised_licenses = [
        LicenseItem(
            id=item["id"],
            label=item["label"],
            desc=item["desc"],
            required=item.get("required", True),
        )
        for item in result.get("licenses", [])
    ]

    return {
        "business_category": result.get("business_category", business_category),
        "state": result.get("state", state),
        "district": result.get("district", district),
        "licenses": [lic.model_dump() for lic in normalised_licenses],
        "sources": result.get("sources", []),
        "ai_generated": result.get("ai_generated", False),
        "confidence": result.get("confidence", 0.0),
    }
