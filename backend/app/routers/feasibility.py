"""Feasibility router with strict live geospatial validation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.feasibility import (
    CapitalEstimateIn,
    CapitalEstimateOut,
    FeasibilityIn,
    FeasibilityOut,
    LGDCode,
)
from app.services.capital_estimation import estimate_capital
from app.services.dpr_ai_service import generate_swot
from app.services.geo_service import (
    GeoUnavailableError,
    compute_density_score,
    compute_verdict,
    forward_geocode,
    get_poi_count_and_query,
    resolve_lgd_live,
    reverse_geocode,
)

router = APIRouter(prefix="/api/feasibility", tags=["feasibility"])


@router.post("/capital-estimate", response_model=CapitalEstimateOut)
async def capital_estimate(
    inp: CapitalEstimateIn,
    user: User = Depends(get_current_user),
) -> CapitalEstimateOut:
    _ = user
    result = await estimate_capital(
        business=inp.business, location=inp.location, state=inp.state,
        base_capex=inp.base_capex,
    )
    values = result.model_dump()
    total = sum(values[key] for key in (
        "rent_deposit", "equipment", "labour_setup",
        "materials_inventory", "licences_utilities",
    ))
    return CapitalEstimateOut(**values, total=total)


@router.get("/reverse-geocode")
async def get_reverse_geocode(lat: float, lon: float):
    """Resolve (lat, lon) coordinates to administrative boundary."""
    res = await reverse_geocode(lat, lon)
    if not res:
        raise HTTPException(status_code=404, detail="Location could not be resolved")
    return res


@router.get("/geocode")
async def get_forward_geocode(query: str):
    """Resolve location string to coordinates and administrative boundary."""
    res = await forward_geocode(query)
    if not res:
        raise HTTPException(status_code=404, detail=f"Location '{query}' could not be resolved")
    return res



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
        b_part = (block or district)[:2].upper()
        code = f"{state[:2].upper()}-{district[:2].upper()}-{b_part}"
        lgd = {
            "state": state,
            "district": district,
            "block": block or district,
            "lgd_code": code,
        }

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
        from app.core.config import settings
        from app.services.geo_service import build_overpass_ql

        if settings.app_env == "production":
            raise HTTPException(
                status_code=502,
                detail="Authoritative location data unavailable",
            ) from exc
        poi_count = 3
        overpass_ql = build_overpass_ql(inp.business_category, lat, lon, inp.radius_m)

    ds = compute_density_score(poi_count, inp.population)
    vd = compute_verdict(ds)

    # Use the same detailed SWOT synthesis as DPR generation so Step 3 is a
    # faithful preview of the report. The service supplies a deterministic,
    # location-aware fallback when an AI key is not configured.
    swot_result = await generate_swot(
        business_name=inp.business_category,
        business_category=inp.business_category,
        location_text=inp.location_text or f"{lgd.block}, {lgd.district}, {lgd.state}",
        poi_count=poi_count,
        verdict=vd,
        loan_amount=0,
    )

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
        swot=swot_result.model_dump(),
        opportunities=opps,
        overpass_ql=overpass_ql,
    )
