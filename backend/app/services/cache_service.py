"""Async Redis cache service.

Provides a thin, namespaced wrapper over redis.asyncio for JSON-serialisable
values.  All keys are prefixed with ``udyog:{version}:`` to enable easy
cache invalidation by bumping the ``cache_key_version`` setting.

Usage
-----
::

    from app.services.cache_service import cache

    # Read
    data = await cache.get_json("revgeo", "25.32", "85.28")

    # Write with TTL
    await cache.set_json("revgeo", value, ttl=86400, parts=["25.32", "85.28"])
"""

from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.cache_service")


class _CacheService:
    """Lazy-connecting async Redis client with namespaced JSON helpers."""

    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None

    def _get_client(self) -> aioredis.Redis:
        if self._client is None:
            self._client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
            )
        return self._client

    def make_key(self, namespace: str, *parts: str) -> str:
        """Build a namespaced, versioned cache key.

        Example: ``make_key("revgeo", "25.32", "85.28")``
        → ``"udyog:v1:revgeo:25.32:85.28"``
        """
        v = settings.cache_key_version
        segments = ":".join(str(p) for p in parts if p is not None)
        return f"udyog:{v}:{namespace}:{segments}"

    async def get_json(self, namespace: str, *parts: str) -> Any | None:
        """Retrieve a JSON-decoded value from Redis.

        Returns ``None`` on cache miss *or* any Redis/network error (the
        caller should proceed to the live provider without raising).
        """
        key = self.make_key(namespace, *parts)
        try:
            raw = await self._get_client().get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Cache GET failed for %r: %s", key, exc)
            return None

    async def set_json(
        self,
        namespace: str,
        value: Any,
        ttl: int,
        *parts: str,
    ) -> None:
        """Serialise *value* to JSON and store it in Redis with *ttl* seconds.

        Silently swallows errors — a cache write failure must never crash the
        request path.
        """
        key = self.make_key(namespace, *parts)
        try:
            serialised = json.dumps(value, default=str)
            await self._get_client().setex(key, ttl, serialised)
        except Exception as exc:
            logger.warning("Cache SET failed for %r: %s", key, exc)

    async def delete(self, namespace: str, *parts: str) -> None:
        """Explicitly evict a cache entry (e.g. after a data update)."""
        key = self.make_key(namespace, *parts)
        try:
            await self._get_client().delete(key)
        except Exception as exc:
            logger.warning("Cache DELETE failed for %r: %s", key, exc)

    async def close(self) -> None:
        """Gracefully close the Redis connection pool."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None


# Module-level singleton — import and use directly.
cache = _CacheService()
