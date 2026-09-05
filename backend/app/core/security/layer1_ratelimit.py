"""Redis token-bucket rate limiting for perimeter-sensitive routes."""

from __future__ import annotations

import json
import time
from collections.abc import Awaitable, Callable

from redis.asyncio import Redis

Send = Callable[[dict], Awaitable[None]]

_TOKEN_BUCKET = """
local state = redis.call('HMGET', KEYS[1], 'tokens', 'updated')
local tokens = tonumber(state[1]) or tonumber(ARGV[1])
local updated = tonumber(state[2]) or tonumber(ARGV[3])
local now = tonumber(ARGV[3])
tokens = math.min(tonumber(ARGV[1]), tokens + (now - updated) * tonumber(ARGV[2]))
if tokens < 1 then
  redis.call('HSET', KEYS[1], 'tokens', tokens, 'updated', now)
  redis.call('EXPIRE', KEYS[1], ARGV[4])
  return {0, tokens}
end
tokens = tokens - 1
redis.call('HSET', KEYS[1], 'tokens', tokens, 'updated', now)
redis.call('EXPIRE', KEYS[1], ARGV[4])
return {1, tokens}
"""

POLICIES = {
    "public": (30, 60),
    "login": (5, 60),
    "job": (5, 60),
}


def policy_for(path: str, method: str) -> str:
    lowered = path.lower()
    if lowered in {"/auth/token", "/auth/login"}:
        return "login"
    if method.upper() in {"POST", "PUT", "PATCH"} and (
        "/dpr" in lowered or "/workflow" in lowered or "pdf" in lowered or "job" in lowered
    ):
        return "job"
    return "public"


class Layer1RateLimitMiddleware:
    def __init__(self, app, redis_client: Redis, key_prefix: str = "layer1:ratelimit") -> None:
        self.app = app
        self.redis = redis_client
        self.key_prefix = key_prefix

    async def __call__(self, scope: dict, receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        policy_name = policy_for(scope.get("path", ""), scope.get("method", "GET"))
        capacity, window = POLICIES[policy_name]
        client = self._client_id(scope)
        key = f"{self.key_prefix}:{policy_name}:{client}"
        try:
            allowed, remaining = await self.redis.eval(
                _TOKEN_BUCKET,
                1,
                key,
                capacity,
                capacity / window,
                time.time(),
                window,
            )
        except Exception:
            await self._reject(send, 503, "Rate limiting service is unavailable")
            return
        if not int(allowed):
            await self._reject(send, 429, "Rate limit exceeded", window)
            return
        await self.app(scope, receive, send)

    @staticmethod
    def _client_id(scope: dict) -> str:
        client = scope.get("client")
        return client[0] if client else "unknown"

    @staticmethod
    async def _reject(send: Send, status: int, detail: str, retry_after: int | None = None) -> None:
        body = json.dumps({"detail": detail}).encode("utf-8")
        headers = [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]
        if retry_after is not None:
            headers.append((b"retry-after", str(retry_after).encode()))
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})