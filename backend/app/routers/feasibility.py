"""Feasibility router with strict live geospatial validation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.feasibility import FeasibilityIn, FeasibilityOut, LGDCode
from app.services.geo_service import (
    GeoUnavailableError,
    compute_density_score,
    compute_verdict,
    get_poi_count_and_query,
    resolve_lgd_live,
    reverse_geocode,
)

router = APIRouter(prefix="/api/feasibility", tags=["feasibility"])


async def _resolve_lgd_for_input(inp: FeasibilityIn) -> LGDCode:
    state: str | None = None
    district: str | None = None
    block: str | None = None

    if inp.location_text and inp.location_text.strip():
        parts = [part.strip() for part in inp.location_text.split(",") if part.strip()]
        if len(parts) >= 3:
            block, district, state = parts[0], parts[1], parts[2]
        elif len(parts) == 2:
            district, state = parts[0], parts[1]
        elif len(parts) == 1:
            block = parts[0]

    if inp.lat is not None and inp.lon is not None:
        geo = await reverse_geocode(inp.lat, inp.lon)
        if geo:
            state = geo.get("state") or state
            district = geo.get("district") or district
            block = geo.get("block") or block

    if not state or not district:
        raise HTTPException(
            status_code=502,
            detail="Authoritative location data unavailable",
        )

    lgd = await resolve_lgd_live(district=district, block=block or "", state=state)
    if lgd is None:
        raise HTTPException(
            status_code=502,
            detail="Authoritative location data unavailable",
        )

    b_part = (block or district)[:2].upper()
    code = lgd.get("lgd_code") or f"{state[:2].upper()}-{district[:2].upper()}-{b_part}"
    return LGDCode(
        state=lgd["state"],
        district=lgd["district"],
        block=lgd["block"],
        gp=None,
        code=code,
        lat=inp.lat if inp.lat is not None else 0.0,
        lon=inp.lon if inp.lon is not None else 0.0,
    )


@router.post("/score", response_model=FeasibilityOut)
async def score(
    inp: FeasibilityIn,
    user: User = Depends(get_current_user),
) -> FeasibilityOut:
    _ = user
    lgd = await _resolve_lgd_for_input(inp)
    lat = inp.lat if inp.lat is not None else lgd.lat
    lon = inp.lon if inp.lon is not None else lgd.lon

    try:
        poi_count, overpass_ql = await get_poi_count_and_query(
            category=inp.business_category,
            lat=lat,
            lon=lon,
            radius_m=inp.radius_m,
        )
    except GeoUnavailableError as exc:
        raise HTTPException(
            status_code=502,
            detail="Authoritative location data unavailable",
        ) from exc

    ds = compute_density_score(poi_count, inp.population)
    vd = compute_verdict(ds)

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
