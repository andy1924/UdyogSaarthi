"""
Async geospatial service — Stage 2 (with Redis provider caching).

Provider chain with cache:
  1. Redis cache (TTL-controlled)     → immediate hit
  2. Mappls primary API               → 4 s timeout
  3. OSM Overpass fallback            → 5 s timeout

Caching strategy:
  reverse_geocode     → 24 h  (location admin-boundary rarely changes)
  resolve_lgd_live    → 7 d   (government LGD codes are stable)
  get_poi_count       → 1 h   (OSM contributor data can update daily)
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.cache_service import cache

logger = logging.getLogger("udyogsaarthi.geo_service")


class GeoUnavailableError(RuntimeError):
    """Raised when all authoritative geospatial providers are exhausted."""

# ── Category mappings ────────────────────────────────────────────────

_MAPPLS_KEYWORDS: dict[str, str] = {
    "dairy": "dairy",
    "food": "restaurant",
    "retail": "grocery",
    "electronics": "electronics",
}

_OSM_TAGS: dict[str, str] = {
    "dairy": "shop=dairy",
    "food": "amenity=restaurant",
    "retail": "shop=supermarket",
    "electronics": "shop=electronics",
}

# ── Mappls Nearby Search ─────────────────────────────────────────────

_MAPPLS_NEARBY_URL = "https://atlas.mappls.com/api/places/nearby/json"
_MAPPLS_TIMEOUT = 4.0


async def _query_mappls(
    lat: float,
    lon: float,
    category: str,
    radius_m: int,
) -> int | None:
    """Query Mappls Nearby Search API. Returns POI count or None."""
    api_key = settings.mappls_rest_key
    if not api_key:
        logger.debug("MAPPLS_REST_KEY not configured — skipping Mappls provider")
        return None

    keyword = _MAPPLS_KEYWORDS.get(category.lower())
    if keyword is None:
        logger.warning("No Mappls keyword mapping for category %r", category)
        return None

    params: dict[str, Any] = {
        "keywords": keyword,
        "refLocation": f"{lat},{lon}",
        "radius": str(radius_m),
    }
    headers = {"Authorization": f"bearer {api_key}"}

    try:
        async with httpx.AsyncClient(timeout=_MAPPLS_TIMEOUT) as client:
            resp = await client.get(_MAPPLS_NEARBY_URL, params=params, headers=headers)

        if resp.status_code != 200:
            logger.warning(
                "Mappls returned HTTP %d for category=%s — falling back",
                resp.status_code, category,
            )
            return None

        data = resp.json()
        if isinstance(data, dict) and "suggestedLocations" in data:
            return len(data["suggestedLocations"])
        if isinstance(data, list):
            return len(data)
        logger.warning("Unexpected Mappls payload structure: %s", type(data))
        return None

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Mappls request failed (%s) — falling back to Overpass", exc)
        return None


# ── OSM Overpass API ─────────────────────────────────────────────────

_OVERPASS_TIMEOUT = 5.0


def build_overpass_ql(
    category: str,
    lat: float,
    lon: float,
    radius_m: int,
) -> str:
    """Build an auditable Overpass QL query string."""
    osm_tag = _OSM_TAGS.get(category.lower(), f"shop={category.lower()}")
    return (
        f"[out:json][timeout:5];\n"
        f'node[{osm_tag}](around:{radius_m},{lat},{lon});\n'
        f"out count;"
    )


async def _query_overpass(overpass_ql: str) -> int | None:
    """Execute Overpass QL, return element count or None on failure."""
    url = settings.overpass_api_url
    try:
        async with httpx.AsyncClient(timeout=_OVERPASS_TIMEOUT) as client:
            resp = await client.post(url, data={"data": overpass_ql})

        if resp.status_code != 200:
            logger.warning("Overpass returned HTTP %d", resp.status_code)
            return None

        data = resp.json()
        elements = data.get("elements", [])
        if elements and "tags" in elements[0]:
            return int(elements[0]["tags"].get("total", 0))
        return len(elements)

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Overpass request failed (%s)", exc)
        return None
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("Overpass response parsing error (%s)", exc)
        return None


# ── Density & Verdict ────────────────────────────────────────────────

_DEFAULT_POPULATION = 50_000


def compute_density_score(poi_count: int, population: int | None) -> int:
    """Compute saturation score in [0, 100]."""
    effective_pop = population if population and population > 0 else _DEFAULT_POPULATION
    raw = (poi_count / effective_pop) * 50_000
    return int(max(0, min(100, raw)))


def compute_verdict(density_score: int) -> str:
    """Deterministic verdict buckets."""
    if density_score > 70:
        return "saturated"
    if density_score < 30:
        return "niche-gap"
    return "viable"


# ── Mappls Reverse Geocoding (with Redis cache) ───────────────────────

_MAPPLS_REVGEO_TIMEOUT = 4.0


async def reverse_geocode(lat: float, lon: float) -> dict[str, str] | None:
    """Resolve (lat, lon) to state/district/block with Redis caching.

    Cache key: ``udyog:{v}:revgeo:{lat:.3f}:{lon:.3f}``  TTL: 24h

    Provider chain:
      1. Redis cache  →  Mappls  →  None
    """
    lat_s = f"{lat:.3f}"
    lon_s = f"{lon:.3f}"

    # 1. Cache hit
    cached = await cache.get_json("revgeo", lat_s, lon_s)
    if cached is not None:
        logger.debug("Cache HIT revgeo (%s, %s)", lat_s, lon_s)
        return cached

    # 2. Live Mappls call
    api_key = settings.mappls_rest_key
    if not api_key:
        logger.warning("MAPPLS_REST_KEY not configured — cannot reverse geocode")
        return None

    url = f"{settings.mappls_rev_geocode_url}/{api_key}/rev_geocode"
    params: dict[str, Any] = {"lat": str(lat), "lng": str(lon)}

    result: dict[str, str] | None = None
    try:
        async with httpx.AsyncClient(timeout=_MAPPLS_REVGEO_TIMEOUT) as client:
            resp = await client.get(url, params=params)

        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results:
                top = results[0]
                state = top.get("state", "").strip()
                district = top.get("district", "").strip()
                block = top.get("area", top.get("subDistrict", "")).strip()
                if state and district:
                    result = {"state": state, "district": district, "block": block}
                    logger.info(
                        "Reverse geocoded (%.5f, %.5f) → %s, %s, %s",
                        lat, lon, state, district, block,
                    )
        else:
            logger.warning(
                "Mappls rev-geocode HTTP %d for (%.5f, %.5f)",
                resp.status_code, lat, lon,
            )
    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Mappls rev-geocode failed (%s)", exc)

    if result is not None:
        await cache.set_json("revgeo", result, settings.cache_ttl_revgeo, lat_s, lon_s)

    return result


# ── Live LGD Resolution (with Redis cache) ────────────────────────────

_LGD_API_BASE = "https://data.gov.in/api/datastore/resource.json"
_LGD_TIMEOUT = 6.0


async def resolve_lgd_live(
    district: str,
    block: str,
    state: str,
) -> dict[str, str] | None:
    """Resolve district/block to authoritative LGD code with Redis caching.

    Cache key: ``udyog:{v}:lgd:{state}:{district}:{block}``  TTL: 7 days
    """
    state_k = state.lower().replace(" ", "_")
    district_k = district.lower().replace(" ", "_")
    block_k = (block or "").lower().replace(" ", "_")

    # 1. Cache hit
    cached = await cache.get_json("lgd", state_k, district_k, block_k)
    if cached is not None:
        logger.debug("Cache HIT lgd %s/%s/%s", state_k, district_k, block_k)
        return cached

    # 2. Live Data.gov.in call
    resource_id = settings.lgd_api_resource_id
    if not resource_id:
        logger.warning("LGD_API_RESOURCE_ID not configured")
        return None

    params: dict[str, Any] = {
        "resource_id": resource_id,
        "filters[district_name]": district,
        "limit": "5",
    }
    if block:
        params["filters[block_name]"] = block

    result: dict[str, str] | None = None
    try:
        async with httpx.AsyncClient(timeout=_LGD_TIMEOUT) as client:
            resp = await client.get(_LGD_API_BASE, params=params)

        if resp.status_code == 200:
            data = resp.json()
            records = data.get("records", [])
            if records:
                rec = records[0]
                lgd_code = (
                    rec.get("block_lgd_code")
                    or rec.get("lgd_code")
                    or rec.get("code", "")
                )
                result = {
                    "state": rec.get("state_name", state).strip(),
                    "district": rec.get("district_name", district).strip(),
                    "block": rec.get("block_name", block).strip(),
                    "lgd_code": str(lgd_code),
                }
                logger.info(
                    "LGD resolved: %s/%s/%s → code=%s",
                    result["state"], result["district"], result["block"], lgd_code,
                )
            else:
                logger.warning(
                    "LGD API: no records for district=%r block=%r state=%r",
                    district, block, state,
                )
        else:
            logger.warning("LGD API HTTP %d for district=%r", resp.status_code, district)

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("LGD request failed (%s)", exc)
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("LGD response parsing error (%s)", exc)

    if result is not None:
        await cache.set_json("lgd", result, settings.cache_ttl_lgd, state_k, district_k, block_k)

    return result


# ── Public entry-point (with Redis cache) ────────────────────────────


async def get_poi_count_and_query(
    category: str,
    lat: float,
    lon: float,
    radius_m: int,
) -> tuple[int, str]:
    """Resolve live POI count with Redis cache.

    Cache key: ``udyog:{v}:poi:{category}:{lat:.3f}:{lon:.3f}:{radius_m}``
    TTL: 1 hour

    Provider chain: Cache → Mappls → Overpass → GeoUnavailableError
    """
    overpass_ql = build_overpass_ql(category, lat, lon, radius_m)
    lat_s = f"{lat:.3f}"
    lon_s = f"{lon:.3f}"
    cat_k = category.lower()
    rad_k = str(radius_m)

    # 1. Cache hit
    cached_count = await cache.get_json("poi", cat_k, lat_s, lon_s, rad_k)
    if cached_count is not None:
        logger.debug("Cache HIT poi %s @(%s,%s) r=%s", cat_k, lat_s, lon_s, rad_k)
        return int(cached_count), overpass_ql

    # 2. Mappls primary
    poi_count = await _query_mappls(lat, lon, category, radius_m)
    if poi_count is not None:
        logger.info(
            "Mappls returned %d POIs for %s @(%.4f, %.4f) r=%dm",
            poi_count, category, lat, lon, radius_m,
        )
        await cache.set_json("poi", poi_count, settings.cache_ttl_poi, cat_k, lat_s, lon_s, rad_k)
        return poi_count, overpass_ql

    # 3. Overpass fallback
    poi_count = await _query_overpass(overpass_ql)
    if poi_count is not None:
        logger.info(
            "Overpass returned %d POIs for %s @(%.4f, %.4f) r=%dm",
            poi_count, category, lat, lon, radius_m,
        )
        # Shorter TTL for Overpass fallback data (less authoritative)
        await cache.set_json(
            "poi", poi_count, settings.cache_ttl_poi // 2, cat_k, lat_s, lon_s, rad_k
        )
        return poi_count, overpass_ql

    # 4. Both failed
    logger.error(
        "Both Mappls and Overpass failed for %s @(%.4f, %.4f). Raising GeoUnavailableError.",
        category, lat, lon,
    )
    raise GeoUnavailableError(
        f"Authoritative POI data unavailable for category={category!r} "
        f"at ({lat:.5f}, {lon:.5f})"
    )
