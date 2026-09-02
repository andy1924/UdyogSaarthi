"""Geo cache warm-up background task.

Runs in the ``default`` queue. Called after a successful live geo resolve so
that the next identical request is served from Redis without hitting government
APIs.

This task is fire-and-forget — callers do not await results.
"""

from __future__ import annotations

import logging

from app.worker.celery_app import celery_app

logger = logging.getLogger("udyogsaarthi.worker.geo_tasks")


@celery_app.task(
    name="app.worker.tasks.geo_tasks.warm_revgeo_cache_task",
    queue="default",
    ignore_result=True,
    acks_late=True,
)
def warm_revgeo_cache_task(lat: float, lon: float, result: dict) -> None:
    """Persist a Mappls reverse-geocode result to Redis.

    Parameters
    ----------
    lat, lon:
        Coordinates that were resolved.
    result:
        The dict returned by Mappls (keys: state, district, block).
    """
    import asyncio

    from app.core.config import settings
    from app.services.cache_service import cache

    lat_s, lon_s = f"{lat:.3f}", f"{lon:.3f}"

    async def _store():
        await cache.set_json("revgeo", result, settings.cache_ttl_revgeo, lat_s, lon_s)

    asyncio.run(_store())
    logger.debug("[geo] warm_revgeo_cache for (%s, %s)", lat_s, lon_s)


@celery_app.task(
    name="app.worker.tasks.geo_tasks.warm_lgd_cache_task",
    queue="default",
    ignore_result=True,
    acks_late=True,
)
def warm_lgd_cache_task(state: str, district: str, block: str, result: dict) -> None:
    """Persist a resolved LGD record to Redis.

    Parameters
    ----------
    state, district, block:
        Administrative boundary strings used as cache key components.
    result:
        The dict returned by the LGD API.
    """
    import asyncio

    from app.core.config import settings
    from app.services.cache_service import cache

    state_k = state.lower().replace(" ", "_")
    district_k = district.lower().replace(" ", "_")
    block_k = (block or "").lower().replace(" ", "_")

    async def _store():
        await cache.set_json(
            "lgd", result, settings.cache_ttl_lgd, state_k, district_k, block_k
        )

    asyncio.run(_store())
    logger.debug("[geo] warm_lgd_cache for %s/%s/%s", state_k, district_k, block_k)
