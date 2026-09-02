"""
Async geospatial service for UdyogSaarthi Feasibility Engine — Stage 1.

Provider chain:
  1. Mappls Nearby Search (primary, 4 s timeout)
  2. OSM Overpass API   (fallback, 5 s timeout)

Every call returns an auditable Overpass QL string so DIC field officers can
independently verify the query against public infrastructure.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

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
_MAPPLS_TIMEOUT = 4.0  # seconds


async def _query_mappls(
    lat: float,
    lon: float,
    category: str,
    radius_m: int,
) -> int | None:
    """
    Query Mappls Nearby Search API.

    Returns the number of POIs found, or ``None`` when the call should be
    treated as failed (missing key, HTTP error, timeout, unexpected payload).
    """
    api_key = settings.mappls_rest_key
    if not api_key:
        logger.debug("MAPPLS_REST_KEY is not configured — skipping Mappls provider")
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
                resp.status_code,
                category,
            )
            return None

        data = resp.json()
        # Mappls returns a list of suggested locations; count entries.
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

_OVERPASS_TIMEOUT = 5.0  # seconds


def build_overpass_ql(
    category: str,
    lat: float,
    lon: float,
    radius_m: int,
) -> str:
    """
    Build an auditable Overpass QL query string.

    Falls back to a generic ``shop=<category>`` tag when the category is
    unknown so the query is still syntactically valid.
    """
    osm_tag = _OSM_TAGS.get(category.lower(), f"shop={category.lower()}")
    # Tag may be in "key=value" form — split for Overpass syntax.
    return (
        f"[out:json][timeout:5];\n"
        f'node[{osm_tag}](around:{radius_m},{lat},{lon});\n'
        f"out count;"
    )


async def _query_overpass(
    overpass_ql: str,
) -> int | None:
    """
    Execute an Overpass QL query and return the element count.

    Returns ``None`` on any transport / parsing failure.
    """
    url = settings.overpass_api_url

    try:
        async with httpx.AsyncClient(timeout=_OVERPASS_TIMEOUT) as client:
            resp = await client.post(url, data={"data": overpass_ql})

        if resp.status_code != 200:
            logger.warning("Overpass returned HTTP %d", resp.status_code)
            return None

        data = resp.json()
        # "out count;" returns tags with a "total" key inside the first element.
        elements = data.get("elements", [])
        if elements and "tags" in elements[0]:
            return int(elements[0]["tags"].get("total", 0))
        # Fallback: count elements directly (when query uses "out body").
        return len(elements)

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Overpass request failed (%s)", exc)
        return None
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("Overpass response parsing error (%s)", exc)
        return None


# ── Density & Verdict ────────────────────────────────────────────────

_DEFAULT_POPULATION = 50_000  # sensible baseline when population is unknown


def compute_density_score(poi_count: int, population: int | None) -> int:
    """
    Compute a saturation score ∈ [0, 100].

    Formula: ``min(100, (poi_count / effective_pop) * normalisation_factor)``
    where the normalisation factor is tuned so that 1 POI per 1 000 people
    ≈ score 50 (indicating moderate saturation).
    """
    effective_pop = population if population and population > 0 else _DEFAULT_POPULATION
    # 1 POI per 1 000 people → score ~50
    raw = (poi_count / effective_pop) * 50_000
    return int(max(0, min(100, raw)))


def compute_verdict(density_score: int) -> str:
    """Deterministic verdict buckets."""
    if density_score > 70:
        return "saturated"
    if density_score < 30:
        return "niche-gap"
    return "viable"


# ── Mappls Reverse Geocoding ─────────────────────────────────────

_MAPPLS_REVGEO_TIMEOUT = 4.0  # seconds


async def reverse_geocode(lat: float, lon: float) -> dict[str, str] | None:
    """
    Resolve *(lat, lon)* to a structured address using Mappls v1 REST API.

    Returns a dict with keys ``state``, ``district``, ``block`` (area-level
    approximation), or ``None`` on any failure (missing key, timeout, HTTP
    error, or unexpected payload).
    """
    api_key = settings.mappls_rest_key
    if not api_key:
        logger.warning("MAPPLS_REST_KEY not configured — cannot reverse geocode")
        return None

    url = f"{settings.mappls_rev_geocode_url}/{api_key}/rev_geocode"
    params: dict[str, Any] = {"lat": str(lat), "lng": str(lon)}

    try:
        async with httpx.AsyncClient(timeout=_MAPPLS_REVGEO_TIMEOUT) as client:
            resp = await client.get(url, params=params)

        if resp.status_code != 200:
            logger.warning(
                "Mappls rev-geocode returned HTTP %d for (%.5f, %.5f)",
                resp.status_code, lat, lon,
            )
            return None

        data = resp.json()
        results = data.get("results", [])
        if not results:
            logger.warning("Mappls rev-geocode: empty results for (%.5f, %.5f)", lat, lon)
            return None

        top = results[0]
        # Mappls v1 fields: state, district, area (sub-district / block proxy)
        state = top.get("state", "").strip()
        district = top.get("district", "").strip()
        # 'area' is the finest admin level available in the v1 rev-geocode response;
        # it maps roughly to block / tehsil for rural Bihar-class locations.
        block = top.get("area", top.get("subDistrict", "")).strip()

        if not state or not district:
            logger.warning(
                "Mappls rev-geocode: incomplete address for (%.5f, %.5f): %s",
                lat, lon, top,
            )
            return None

        logger.info(
            "Reverse geocoded (%.5f, %.5f) → %s, %s, %s",
            lat, lon, state, district, block,
        )
        return {"state": state, "district": district, "block": block}

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Mappls rev-geocode request failed (%s)", exc)
        return None


# ── Live LGD Resolution via Data.gov.in CKAN API ─────────────────────

_LGD_API_BASE = "https://data.gov.in/api/datastore/resource.json"
_LGD_TIMEOUT = 6.0  # seconds; government APIs can be slow


async def resolve_lgd_live(
    district: str,
    block: str,
    state: str,
) -> dict[str, str] | None:
    """
    Query the Data.gov.in LGD block dataset for an authoritative LGD record.

    Parameters
    ----------
    district:
        District name as returned by Mappls reverse-geocode.
    block:
        Block / tehsil name (may be empty for urban centres).
    state:
        State name.

    Returns
    -------
    dict with keys ``state``, ``district``, ``block``, ``lgd_code``, or
    ``None`` when no authoritative record is found.
    """
    resource_id = settings.lgd_api_resource_id
    if not resource_id:
        logger.warning("LGD_API_RESOURCE_ID not configured — cannot resolve LGD")
        return None

    # Try block-level lookup first; fall back to district-only if block is empty.
    filters: dict[str, str] = {"district_name": district}
    if block:
        filters["block_name"] = block

    params: dict[str, Any] = {
        "resource_id": resource_id,
        "filters[district_name]": district,
        "limit": "5",
    }
    if block:
        params["filters[block_name]"] = block

    try:
        async with httpx.AsyncClient(timeout=_LGD_TIMEOUT) as client:
            resp = await client.get(_LGD_API_BASE, params=params)

        if resp.status_code != 200:
            logger.warning(
                "Data.gov.in LGD API returned HTTP %d for district=%r block=%r",
                resp.status_code, district, block,
            )
            return None

        data = resp.json()
        records = data.get("records", [])
        if not records:
            logger.warning(
                "LGD API: no records for district=%r block=%r state=%r",
                district, block, state,
            )
            return None

        rec = records[0]
        # Common field names in the Data.gov.in LGD block dataset:
        #   state_name, district_name, block_name, block_lgd_code
        lgd_code = (
            rec.get("block_lgd_code")
            or rec.get("lgd_code")
            or rec.get("code", "")
        )
        resolved_state = rec.get("state_name", state).strip()
        resolved_district = rec.get("district_name", district).strip()
        resolved_block = rec.get("block_name", block).strip()

        logger.info(
            "LGD resolved: %s / %s / %s → code=%s",
            resolved_state, resolved_district, resolved_block, lgd_code,
        )
        return {
            "state": resolved_state,
            "district": resolved_district,
            "block": resolved_block,
            "lgd_code": str(lgd_code),
        }

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("Data.gov.in LGD request failed (%s)", exc)
        return None
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("LGD response parsing error (%s)", exc)
        return None


# ── Public entry-point ───────────────────────────────────────────────


async def get_poi_count_and_query(
    category: str,
    lat: float,
    lon: float,
    radius_m: int,
) -> tuple[int, str]:
    """
    Resolve the live POI count for *category* around *(lat, lon)*.

    Returns ``(poi_count, overpass_ql_string)``.  The Overpass QL string is
    always constructed even when Mappls is the data-source so that the query
    remains auditable.
    """
    overpass_ql = build_overpass_ql(category, lat, lon, radius_m)

    # Primary: Mappls
    poi_count = await _query_mappls(lat, lon, category, radius_m)
    if poi_count is not None:
        logger.info(
            "Mappls returned %d POIs for %s @(%.4f, %.4f) r=%dm",
            poi_count,
            category,
            lat,
            lon,
            radius_m,
        )
        return poi_count, overpass_ql

    # Fallback: Overpass
    poi_count = await _query_overpass(overpass_ql)
    if poi_count is not None:
        logger.info(
            "Overpass returned %d POIs for %s @(%.4f, %.4f) r=%dm",
            poi_count,
            category,
            lat,
            lon,
            radius_m,
        )
        return poi_count, overpass_ql

    # Both providers failed — raise so callers can surface a strict 502.
    logger.error(
        "Both Mappls and Overpass failed for %s @(%.4f, %.4f). "
        "Raising GeoUnavailableError.",
        category,
        lat,
        lon,
    )
    raise GeoUnavailableError(
        f"Authoritative POI data unavailable for category={category!r} "
        f"at ({lat:.5f}, {lon:.5f})"
    )
