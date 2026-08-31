from fastapi import APIRouter
from app.schemas.feasibility import FeasibilityIn, FeasibilityOut, LGDCode
import hashlib
import math

router = APIRouter(prefix="/api/feasibility", tags=["feasibility"])

# Mock LGD resolver — deterministic hash so any location returns stable lat/lon
MOCK_LGD = {
    "hilsa": LGDCode(state="Bihar", district="Nalanda", block="Hilsa", gp="Hilsa", code="BR-NA-HI-001", lat=25.32, lon=85.28),
    "nalanda": LGDCode(state="Bihar", district="Nalanda", block="Nalanda", gp=None, code="BR-NA-NA-001", lat=25.13, lon=85.44),
}

def resolve_lgd(text: str, lat=None, lon=None) -> LGDCode:
    key = text.lower()
    for k, v in MOCK_LGD.items():
        if k in key:
            return v
    # hash to deterministic Bihar-ish lat/lon offset
    h = int(hashlib.md5(text.encode()).hexdigest()[:6], 16)
    return LGDCode(state="Bihar", district="Nalanda", block=text.split(",")[0].strip().title()[:20], gp=None, code=f"BR-XX-{h%999:03d}", lat=25.0 + (h % 100)/200, lon=85.0 + (h % 100)/200)

def density_score(poi: int, population: int | None) -> float:
    # 0-100: 0 poi -> 0, 50 poi -> 75, capped 100. Population dampens.
    base = min(100, (poi / 40) * 100 * 0.8 + (poi / 200) * 100 * 0.2)
    if population and population > 80000:
        base *= 0.85
    return round(max(0, min(100, base)), 1)

def verdict(score: float) -> str:
    if score > 70: return "saturated"
    if score < 30: return "niche-gap"
    return "viable"

def mock_poi_count(text: str, category: str, radius: int) -> int:
    h = int(hashlib.md5(f"{text}:{category}:{radius}".encode()).hexdigest()[:4], 16)
    # bias: electronics/dairy more saturated in demo
    bias = {"electronics": 8, "dairy": 5, "retail": 3}.get(category.lower(), 0)
    return max(2, (h % 38) + bias)

@router.post("/score", response_model=FeasibilityOut)
def score(inp: FeasibilityIn):
    lgd = resolve_lgd(inp.location_text, inp.lat, inp.lon)
    lat = inp.lat or lgd.lat
    lon = inp.lon or lgd.lon
    poi = mock_poi_count(inp.location_text, inp.business_category, inp.radius_m)
    ds = density_score(poi, inp.population)
    vd = verdict(ds)
    swot = {
        "strength": "Local demand for daily-need category" if vd != "saturated" else "High footfall area",
        "weakness": "High competition" if vd == "saturated" else "Need awareness",
        "opportunity": "Pivot to allied service" if vd == "saturated" else "First-mover gap in 5km",
        "threat": f"{poi} similar shops in {inp.radius_m/1000:.0f}km radius — price war risk" if vd == "saturated" else "Input cost volatility",
    }
    opps = []
    if vd == "saturated":
        opps = [
            {"title": "Agro-processing (millets/spices)", "reason": "No dedicated unit in 5km"},
            {"title": "Cold storage micro-unit", "reason": "Perishables gap"},
            {"title": "Repair & spares hub", "reason": "Serves existing shops"},
        ]
    ql = f'node["shop"="{inp.business_category}"](around:{inp.radius_m},{lat},{lon}); out count;'
    return FeasibilityOut(lgd=lgd, business_category=inp.business_category, poi_count=poi, density_score=ds, verdict=vd, swot=swot, opportunities=opps, overpass_ql=ql)
