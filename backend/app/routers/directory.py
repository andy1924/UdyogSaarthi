from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.directory import BusinessProfile
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
    point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    distance_expr = func.ST_Distance(BusinessProfile.location, point.cast("geography")).label(
        "distance_m"
    )
    stmt = select(
        BusinessProfile.id,
        BusinessProfile.name,
        BusinessProfile.category,
        func.ST_X(BusinessProfile.location).label("profile_lon"),
        func.ST_Y(BusinessProfile.location).label("profile_lat"),
        distance_expr,
    ).where(func.ST_DWithin(BusinessProfile.location, point.cast("geography"), radius_m))

    if category:
        stmt = stmt.where(BusinessProfile.category.ilike(category))

    stmt = stmt.order_by(distance_expr).limit(20)

    try:
        rows = (await db.execute(stmt)).all()
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

    sql = (
        "SELECT id, name, category, ST_X(location), ST_Y(location), "
        "ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) "
        "FROM business_profiles WHERE ST_DWithin(location, "
        "ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_m) "
        "ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography);"
    )

    return DirectoryOut(
        query={"lat": lat, "lon": lon, "radius_m": radius_m, "category": category},
        count=len(profiles),
        profiles=profiles,
        sql=sql,
    )
