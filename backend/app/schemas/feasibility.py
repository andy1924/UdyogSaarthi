from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class FeasibilityIn(BaseModel):
    location_text: str = Field(..., description="Free text: block/district e.g. 'Hilsa, Nalanda, Bihar'")
    business_category: str = Field(..., description="e.g. dairy, retail, electronics, agro-processing")
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)
    radius_m: int = Field(5000, ge=1000, le=10000, description="Overpass radius")
    population: int | None = Field(None, description="Block population for density normalisation")


class LGDCode(BaseModel):
    state: str
    district: str
    block: str
    gp: str | None = None
    code: str
    lat: float
    lon: float


class FeasibilityOut(BaseModel):
    lgd: LGDCode
    business_category: str
    poi_count: int
    density_score: float = Field(description="0-100")
    verdict: Literal["saturated", "viable", "niche-gap"]
    swot: dict
    opportunities: list[dict]
    overpass_ql: str
