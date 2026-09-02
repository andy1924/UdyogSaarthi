"""RAG-powered compliance checklist generator.

Pipeline:
  1. Check Redis cache (12h TTL)
  2. Query ChromaDB for relevant compliance context chunks
  3. Call OpenAI gpt-4o-mini with retrieved context + structured output
  4. Cache and return

Fallback chain:
  - ChromaDB empty → direct OpenAI call with base prompt
  - OpenAI unavailable → return hardcoded rule set (existing compliance.py logic)
  - Any unrecoverable error → hardcoded fallback (no 500)
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.core.config import settings
from app.services.cache_service import cache
from app.services.rag.embedder import query_collection

logger = logging.getLogger("udyogsaarthi.rag.compliance")

# ── Hardcoded fallback (identical to old compliance.py) ───────────────

_FALLBACK_RULES: dict[str, list[dict]] = {
    "dairy": [
        {"id": "udyam", "label": "Udyam Registration",
         "desc": "MSME registration via udyamregistration.gov.in", "required": True},
        {"id": "fssai", "label": "FSSAI Licence",
         "desc": "Food safety for milk/products", "required": True},
        {"id": "trade", "label": "Trade Licence",
         "desc": "Panchayat/municipal trade licence", "required": True},
    ],
    "food": [
        {"id": "udyam", "label": "Udyam Registration",
         "desc": "MSME registration", "required": True},
        {"id": "fssai", "label": "FSSAI Licence",
         "desc": "Food safety", "required": True},
        {"id": "trade", "label": "Trade Licence",
         "desc": "Panchayat/municipal", "required": True},
    ],
    "retail": [
        {"id": "udyam", "label": "Udyam Registration",
         "desc": "MSME registration", "required": True},
        {"id": "trade", "label": "Trade Licence",
         "desc": "Panchayat/municipal", "required": True},
        {"id": "gst", "label": "GST Registration",
         "desc": "If turnover > threshold", "required": False},
    ],
    "electronics": [
        {"id": "udyam", "label": "Udyam Registration",
         "desc": "MSME", "required": True},
        {"id": "trade", "label": "Trade Licence",
         "desc": "Panchayat/municipal", "required": True},
    ],
}

_DEFAULT_FALLBACK = [
    {"id": "udyam", "label": "Udyam Registration",
     "desc": "MSME registration", "required": True},
    {"id": "trade", "label": "Trade Licence",
     "desc": "Panchayat/municipal", "required": True},
]

# ── OpenAI structured output schema ──────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a compliance expert for Indian micro-enterprise licensing. "
    "Given retrieved context from official guidelines, produce an accurate, "
    "complete list of licences and registrations required for the specified "
    "business in the given Indian state/district. "
    "Return ONLY a JSON object matching the provided schema."
)

_USER_PROMPT = """\
Business category: {category}
State: {state}
District: {district}

Retrieved compliance context:
---
{context}
---

List all required and optional licences/registrations for this business.
For each item include: id (short slug), label, desc, required (bool).
"""


async def get_compliance_checklist(
    business_category: str,
    state: str = "",
    district: str = "",
) -> dict[str, Any]:
    """Return a compliance checklist, using RAG + OpenAI when available.

    Parameters
    ----------
    business_category:
        Business type (e.g. ``dairy``, ``retail``).
    state:
        State name for regional context (optional).
    district:
        District name for hyper-local context (optional).

    Returns
    -------
    dict with keys:
        - ``business_category``: str
        - ``state``, ``district``: str
        - ``licenses``: list of LicenseItem dicts
        - ``sources``: list of source file names
        - ``ai_generated``: bool
        - ``confidence``: float  (0.0 = fallback, 1.0 = full AI)
    """
    cat = business_category.lower().strip()
    state_s = state.strip()
    district_s = district.strip()

    # 1. Cache hit
    cache_parts = [cat, state_s or "any", district_s or "any"]
    cached = await cache.get_json("compliance", *cache_parts)
    if cached is not None:
        logger.debug("Cache HIT compliance %s/%s/%s", cat, state_s, district_s)
        return cached

    # 2. Try RAG pipeline
    result = await _rag_pipeline(cat, state_s, district_s)

    # 3. Cache result
    await cache.set_json("compliance", result, settings.cache_ttl_compliance, *cache_parts)
    return result


async def _rag_pipeline(cat: str, state: str, district: str) -> dict[str, Any]:
    """Execute the full RAG pipeline with fallback."""
    openai_key = settings.openai_api_key

    # Retrieve context chunks from ChromaDB
    query = f"compliance requirements for {cat} business in {state or 'India'}"
    if district:
        query += f", {district} district"

    chunks = await asyncio.to_thread(query_collection, query, 5)

    if not chunks:
        logger.info("ChromaDB empty or query failed — using hardcoded fallback")
        return _build_fallback(cat, state, district)

    context = "\n\n---\n\n".join(c["document"] for c in chunks)
    sources = list({c["metadata"].get("source", "unknown") for c in chunks})
    avg_dist = sum(c["distance"] for c in chunks) / len(chunks) if chunks else 1.0
    confidence = max(0.0, min(1.0, 1.0 - avg_dist))

    if not openai_key:
        logger.info("OPENAI_API_KEY not set — returning context-based fallback")
        # Return fallback augmented with source attribution
        fb = _build_fallback(cat, state, district)
        fb["sources"] = sources
        fb["confidence"] = round(confidence * 0.5, 2)  # half confidence without AI
        return fb

    # OpenAI structured call
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=openai_key)
        prompt = _USER_PROMPT.format(
            category=cat,
            state=state or "India",
            district=district or "general",
            context=context[:8000],  # token budget guard
        )

        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=1500,
        )

        import json
        raw = resp.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        licenses = parsed.get("licenses", parsed.get("items", []))
        if not isinstance(licenses, list) or not licenses:
            raise ValueError("OpenAI returned no license items")

        # Normalise items to expected schema
        normalised = _normalise_licenses(licenses)
        return {
            "business_category": cat,
            "state": state,
            "district": district,
            "licenses": normalised,
            "sources": sources,
            "ai_generated": True,
            "confidence": round(confidence, 2),
        }

    except Exception as exc:
        logger.warning("OpenAI RAG call failed (%s) — using fallback", exc)
        fb = _build_fallback(cat, state, district)
        fb["sources"] = sources
        return fb


def _normalise_licenses(raw: list) -> list[dict]:
    """Ensure each item has the expected LicenseItem fields."""
    result = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        result.append({
            "id": str(item.get("id", item.get("slug", "unknown"))),
            "label": str(item.get("label", item.get("name", ""))),
            "desc": str(item.get("desc", item.get("description", ""))),
            "required": bool(item.get("required", True)),
        })
    return result


def _build_fallback(cat: str, state: str, district: str) -> dict[str, Any]:
    """Return the hardcoded fallback rule set."""
    licenses = _FALLBACK_RULES.get(cat, _DEFAULT_FALLBACK)
    return {
        "business_category": cat,
        "state": state,
        "district": district,
        "licenses": licenses,
        "sources": ["hardcoded_rules"],
        "ai_generated": False,
        "confidence": 0.0,
    }
