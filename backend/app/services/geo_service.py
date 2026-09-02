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

    # Both providers failed — degrade gracefully.
    logger.error(
        "Both Mappls and Overpass failed for %s @(%.4f, %.4f). Defaulting to 0 POIs.",
        category,
        lat,
        lon,
    )
    return 0, overpass_ql
