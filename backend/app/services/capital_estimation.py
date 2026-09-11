"""Location-aware capital estimates with deterministic validation and totals."""

from __future__ import annotations

import logging

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.capital_estimation")


class CapitalBreakdown(BaseModel):
    rent_deposit: int = Field(ge=0)
    equipment: int = Field(ge=0)
    labour_setup: int = Field(ge=0)
    materials_inventory: int = Field(ge=0)
    licences_utilities: int = Field(ge=0)
    explanation: str


def _fallback(base_capex: int, state: str) -> CapitalBreakdown:
    factor = 1.12 if state.casefold() in {
        "maharashtra", "delhi", "karnataka", "telangana", "tamil nadu"
    } else 0.94
    adjusted = round(base_capex * factor)
    shares = (0.12, 0.48, 0.08, 0.25)
    values = [round(adjusted * share) for share in shares]
    return CapitalBreakdown(
        rent_deposit=values[0], equipment=values[1], labour_setup=values[2],
        materials_inventory=values[3], licences_utilities=adjusted - sum(values),
        explanation="Regional micro-enterprise benchmark; verify with local quotations.",
    )


async def estimate_capital(
    *, business: str, location: str, state: str, base_capex: int
) -> CapitalBreakdown:
    if not settings.openai_api_key:
        return _fallback(base_capex, state)
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        completion = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Estimate realistic Indian Tier-3 micro-enterprise setup costs. "
                        "Return components only; use conservative INR integers."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Business: {business}\nLocation: {location}\n"
                        f"National benchmark: INR {base_capex}"
                    ),
                },
            ],
            response_format=CapitalBreakdown,
        )
        result = completion.choices[0].message.parsed
        if result is None:
            raise ValueError("Empty capital estimate")
        total = sum((result.rent_deposit, result.equipment, result.labour_setup,
                     result.materials_inventory, result.licences_utilities))
        if not base_capex * 0.55 <= total <= base_capex * 1.6:
            raise ValueError("Estimate outside safe benchmark range")
        return result
    except Exception as exc:
        logger.warning("Capital estimate fallback: %s", exc)
        return _fallback(base_capex, state)
