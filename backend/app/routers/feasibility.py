"""
Feasibility router — Stage 1 (live geo integration).

Replaces the deterministic MD5-hash mock with live Mappls / Overpass queries
via ``app.services.geo_service``.  Mock LGD resolution is retained until a
live LGD Directory API is integrated (Stage 2).
"""

from __future__ import annotations

import hashlib

from fastapi import APIRouter

from app.schemas.feasibility import FeasibilityIn, FeasibilityOut, LGDCode
from app.services.geo_service import (
    compute_density_score,
    compute_verdict,
    get_poi_count_and_query,
)

router = APIRouter(prefix="/api/feasibility", tags=["feasibility"])

# ── Mock LGD resolver (unchanged until Stage 2) ─────────────────────

MOCK_LGD = {
    "hilsa": LGDCode(
        state="Bihar",
        district="Nalanda",
        block="Hilsa",
        gp="Hilsa",
        code="BR-NA-HI-001",
        lat=25.32,
        lon=85.28,
    ),
    "nalanda": LGDCode(
        state="Bihar",
        district="Nalanda",
        block="Nalanda",
        gp=None,
        code="BR-NA-NA-001",
        lat=25.13,
        lon=85.44,
    ),
}


def resolve_lgd(text: str, lat: float | None = None, lon: float | None = None) -> LGDCode:
    key = text.lower()
    for k, v in MOCK_LGD.items():
        if k in key:
            return v
    # hash to deterministic Bihar-ish lat/lon offset
    h = int(hashlib.md5(text.encode()).hexdigest()[:6], 16)
    return LGDCode(
        state="Bihar",
        district="Nalanda",
        block=text.split(",")[0].strip().title()[:20],
        gp=None,
        code=f"BR-XX-{h % 999:03d}",
        lat=25.0 + (h % 100) / 200,
        lon=85.0 + (h % 100) / 200,
    )


# ── Endpoint ─────────────────────────────────────────────────────────


@router.post("/score", response_model=FeasibilityOut)
async def score(inp: FeasibilityIn) -> FeasibilityOut:
    lgd = resolve_lgd(inp.location_text, inp.lat, inp.lon)
    lat = inp.lat or lgd.lat
    lon = inp.lon or lgd.lon

    # ── Live geo lookup ──────────────────────────────────────────
    poi_count, overpass_ql = await get_poi_count_and_query(
        category=inp.business_category,
        lat=lat,
        lon=lon,
        radius_m=inp.radius_m,
    )

    ds = compute_density_score(poi_count, inp.population)
    vd = compute_verdict(ds)

    # ── SWOT & opportunities (deterministic rules) ───────────────
    swot = {
        "strength": (
            "Local demand for daily-need category"
            if vd != "saturated"
            else "High footfall area"
        ),
        "weakness": "High competition" if vd == "saturated" else "Need awareness",
        "opportunity": (
            "Pivot to allied service"
            if vd == "saturated"
            else "First-mover gap in 5km"
        ),
        "threat": (
            f"{poi_count} similar shops in {inp.radius_m / 1000:.0f}km radius — price war risk"
            if vd == "saturated"
            else "Input cost volatility"
        ),
    }

    opps: list[dict] = []
    if vd == "saturated":
        opps = [
            {"title": "Agro-processing (millets/spices)", "reason": "No dedicated unit in 5km"},
            {"title": "Cold storage micro-unit", "reason": "Perishables gap"},
            {"title": "Repair & spares hub", "reason": "Serves existing shops"},
        ]

    return FeasibilityOut(
        lgd=lgd,
        business_category=inp.business_category,
        poi_count=poi_count,
        density_score=ds,
        verdict=vd,
        swot=swot,
        opportunities=opps,
        overpass_ql=overpass_ql,
    )
