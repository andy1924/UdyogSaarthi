from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.directory import DirectoryOut, NearbyProfile

router = APIRouter(prefix="/api/directory", tags=["directory"])


@router.get("/nearby", response_model=DirectoryOut)
async def nearby(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_m: int = Query(10000, ge=1000, le=50000),
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    sql_base = """
        SELECT id, name, category, ST_X(location::geometry) AS profile_lon,
               ST_Y(location::geometry) AS profile_lat,
               ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography)
                   AS distance_m
        FROM business_profiles
        WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_m)
    """
    params = {"lat": lat, "lon": lon, "radius_m": radius_m}
    if category:
        sql_base += " AND category ILIKE :category"
        params["category"] = f"%{category}%"
    sql_base += " ORDER BY distance_m LIMIT 20;"

    try:
        from sqlalchemy import text
        rows = (await db.execute(text(sql_base), params)).all()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Authoritative directory data unavailable",
        ) from exc

    profiles = [
        NearbyProfile(
            id=str(row[0]),
            name=row[1],
            category=row[2],
            distance_m=float(row[5]),
            lat=float(row[4]),
            lon=float(row[3]),
        )
        for row in rows
    ]

    return DirectoryOut(
        query={"lat": lat, "lon": lon, "radius_m": radius_m, "category": category},
        count=len(profiles),
        profiles=profiles,
        sql=sql_base,
    )
