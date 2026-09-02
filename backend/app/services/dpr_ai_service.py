"""
Async AI narrative service — SWOT synthesis via OpenAI Structured Outputs.

Uses the ``openai`` SDK (v1.40+) with ``response_format`` to guarantee
schema-conforming JSON parsed into a strict Pydantic v2 model.

Gracefully falls back to a static SWOT when the API key is missing or the
call fails so DPR generation is never blocked.
"""

from __future__ import annotations

import logging

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.dpr_ai_service")


# ── Strictly-typed response model ────────────────────────────────────


class SWOTAnalysis(BaseModel):
    """Schema passed to OpenAI ``response_format`` for structured output."""

    strengths: list[str] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="2-3 hyper-local business strengths",
    )
    weaknesses: list[str] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="2 internal operational risks",
    )
    opportunities: list[str] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="3 practical rural pivot angles (cold storage, agro-processing, etc.)",
    )
    threats: list[str] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="2 market competition or price-war threats",
    )
    advisory_summary: str = Field(
        ...,
        description="2-sentence actionable advice for a rural banker",
    )


# ── Prompt templates ─────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a rural credit appraisal officer for Indian District Industries "
    "Centres (DIC). You evaluate micro-enterprise loan proposals from Tier-3/4 "
    "towns and villages across India. Your assessments are grounded in ground-"
    "level realities: seasonal demand, local competition density, perishable "
    "supply chains, and government scheme eligibility. Provide actionable, "
    "frank analysis — not generic MBA frameworks."
)

_USER_PROMPT_TEMPLATE = """\
Analyse this micro-enterprise loan proposal and produce a SWOT analysis.

**Business:** {business_name} ({business_category})
**Location:** {location_text}
**Nearby competitors (POI count):** {poi_count} within search radius
**Feasibility verdict:** {verdict}
**Loan amount requested:** ₹{loan_amount:,.0f}

Instructions:
- Strengths must reference the specific business type and location.
- Weaknesses must address realistic operational risks for rural India.
- Opportunities must suggest practical pivots (e.g., cold storage, agro-processing, allied services).
- Threats must reference local competition data and market dynamics.
- Advisory summary must be 2 sentences of actionable advice for the branch manager.
"""


# ── Static fallback ──────────────────────────────────────────────────


def _static_fallback(
    business_category: str,
    poi_count: int,
    verdict: str,
    radius_m: int = 5000,
) -> SWOTAnalysis:
    """Deterministic SWOT when AI is unavailable."""
    return SWOTAnalysis(
        strengths=[
            f"Local demand for {business_category} in underserved area",
            "Low initial capex for micro-unit setup",
        ],
        weaknesses=[
            "Limited formal bookkeeping and digital payment adoption",
            "Dependence on single seasonal revenue cycle",
        ],
        opportunities=[
            "Agro-processing (millets/spices) — no dedicated unit within 5 km",
            "Cold storage micro-unit to bridge perishables gap",
            "Repair & spares hub serving existing shops in radius",
        ],
        threats=[
            f"{poi_count} similar outlets within {radius_m / 1000:.0f} km — price war risk"
            if verdict == "saturated"
            else "Input cost volatility and supply chain disruption",
            "Delayed monsoon or crop failure reducing local purchasing power",
        ],
        advisory_summary=(
            f"The {business_category} segment shows a '{verdict}' density profile. "
            "Recommend conditional sanction with quarterly review of sales velocity."
        ),
    )


# ── Public API ───────────────────────────────────────────────────────


async def generate_swot(
    *,
    business_name: str,
    business_category: str,
    location_text: str,
    poi_count: int,
    verdict: str,
    loan_amount: float,
    radius_m: int = 5000,
) -> SWOTAnalysis:
    """
    Generate a SWOT analysis via OpenAI Structured Outputs.

    Falls back to :func:`_static_fallback` if the API key is missing or
    the call fails for any reason.
    """
    api_key = settings.openai_api_key
    if not api_key:
        logger.debug("OPENAI_API_KEY not configured — using static SWOT")
        return _static_fallback(business_category, poi_count, verdict, radius_m)

    user_prompt = _USER_PROMPT_TEMPLATE.format(
        business_name=business_name,
        business_category=business_category,
        location_text=location_text,
        poi_count=poi_count,
        verdict=verdict,
        loan_amount=loan_amount,
    )

    try:
        client = AsyncOpenAI(api_key=api_key)
        completion = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format=SWOTAnalysis,
        )

        parsed = completion.choices[0].message.parsed
        if parsed is None:
            logger.warning("OpenAI returned no parsed output — using static fallback")
            return _static_fallback(business_category, poi_count, verdict, radius_m)

        logger.info("AI SWOT generated successfully for %s", business_name)
        return parsed

    except Exception as exc:
        # Catch *all* errors (auth, timeout, rate-limit, validation) to
        # guarantee the DPR endpoint never fails due to AI unavailability.
        logger.warning("OpenAI call failed (%s: %s) — using static fallback", type(exc).__name__, exc)
        return _static_fallback(business_category, poi_count, verdict, radius_m)
