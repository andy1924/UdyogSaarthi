from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class FeasibilityIn(BaseModel):
    location_text: str | None = Field(
        None,
        description=(
            "Free text: block/district e.g. 'Hilsa, Nalanda, Bihar'. "
            "Optional when lat+lon are provided (reverse geocode will resolve the address)."
        ),
    )
    business_category: str = Field(
        ..., description="e.g. dairy, retail, electronics, agro-processing"
    )
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)
    radius_m: int = Field(5000, ge=1000, le=10000, description="Overpass radius")
    population: int | None = Field(None, description="Block population for density normalisation")

    @model_validator(mode="after")
    def _require_location_anchor(self) -> "FeasibilityIn":
        has_text = bool(self.location_text and self.location_text.strip())
        has_coords = self.lat is not None and self.lon is not None
        if not has_text and not has_coords:
            raise ValueError(
                "Provide either 'location_text' or both 'lat' and 'lon'."
            )
        return self


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

