from fastapi import APIRouter, Query
from app.schemas.directory import DirectoryOut, NearbyProfile
import hashlib

router = APIRouter(prefix="/api/directory", tags=["directory"])

NAMES = ["Ravi Traders", "Lakshmi Dairy", "Nalanda Repair Hub", "Hilsa Millers", "Udyog Kendra", "Sharma Stores", "Priya Agro"]

@router.get("/nearby", response_model=DirectoryOut)
def nearby(lat: float = Query(...), lon: float = Query(...), radius_m: int = Query(10000, ge=1000, le=50000), category: str | None = Query(None)):
    h = int(hashlib.md5(f"{lat:.2f}:{lon:.2f}:{category}".encode()).hexdigest()[:4], 16)
    n = (h % 4) + 2  # 2-5 profiles
    profiles = []
    for i in range(n):
        d = 400 + (hashlib.md5(f"{lat}:{i}".encode()).hexdigest()[0:2].__hash__() % (radius_m - 400))
        # simpler deterministic distance
        d = 500 + ((h + i*733) % (radius_m - 600))
        profiles.append(NearbyProfile(id=f"p{i+1}", name=NAMES[(h+i) % len(NAMES)], category=(category or ["dairy","retail","electronics"][i%3]), distance_m=d, lat=lat+ (i*0.004), lon=lon+(i*0.004)))
    profiles.sort(key=lambda p: p.distance_m)
    sql = f"SELECT * FROM profiles WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint({lon},{lat}),4326)::geography, {radius_m})"
    if category:
        sql += f" AND category='{category}'"
    sql += " ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography) LIMIT 20;"
    return DirectoryOut(query={"lat": lat, "lon": lon, "radius_m": radius_m, "category": category}, count=len(profiles), profiles=profiles, sql=sql)
