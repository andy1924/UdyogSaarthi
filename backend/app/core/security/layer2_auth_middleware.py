"""ASGI identity context injection and fail-closed JWT validation."""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable

from redis.asyncio import Redis

from app.core.security.layer2_jwt import Layer2JWTError, decode_active_token

Send = Callable[[dict], Awaitable[None]]


class Layer2AuthMiddleware:
    def __init__(self, app, secret_key: str, algorithm: str, redis_client: Redis) -> None:
        self.app = app
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.redis = redis_client

    async def __call__(self, scope: dict, receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        authorization = dict(scope.get("headers", [])).get(b"authorization", b"").decode(
            "ascii", "ignore"
        )
        if not authorization:
            await self.app(scope, receive, send)
            return
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            await self._reject(send, 401, "Invalid authorization header")
            return
        try:
            claims = await decode_active_token(token, self.secret_key, self.algorithm, self.redis)
        except Layer2JWTError as exc:
            status = 503 if "unavailable" in str(exc) else 401
            await self._reject(send, status, str(exc))
            return

        state = scope.setdefault("state", {})
        state["identity"] = {
            "user_id": claims["sub"],
            "role": claims["role"],
            "jti": claims["jti"],
            "token_version": claims.get("token_version", 0),
        }
        await self.app(scope, receive, send)

    @staticmethod
    async def _reject(send: Send, status: int, detail: str) -> None:
        body = json.dumps({"detail": detail}).encode("utf-8")
        headers = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body)).encode()),
        ]
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})