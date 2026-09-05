"""Request signing and replay protection for mutating API requests."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from collections.abc import Awaitable, Callable

from redis.asyncio import Redis

Send = Callable[[dict], Awaitable[None]]
Receive = Callable[[], Awaitable[dict]]


def _response(start: int, body: bytes) -> dict:
    headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode()),
    ]
    if start == 401:
        headers.append((b"www-authenticate", b"Bearer"))
    return {
        "type": "http.response.start",
        "status": start,
        "headers": headers,
    }


class Layer1HMACMiddleware:
    """Validate HMAC signatures and atomically reserve request nonces."""

    def __init__(
        self,
        app,
        secret_key: str,
        redis_client: Redis | None = None,
        max_age_seconds: int = 120,
    ) -> None:
        self.app = app
        self.secret_key = secret_key.encode("utf-8")
        self.redis = redis_client
        self.max_age_seconds = max_age_seconds

    async def __call__(self, scope: dict, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method", "GET").upper() not in {
            "POST",
            "PUT",
            "PATCH",
        }:
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        timestamp = headers.get(b"x-timestamp", b"").decode("ascii", "ignore")
        nonce = headers.get(b"x-nonce", b"").decode("ascii", "ignore")
        supplied_signature = headers.get(b"x-signature", b"").decode("ascii", "ignore")
        body = await self._read_body(receive)

        try:
            request_time = float(timestamp)
        except ValueError:
            await self._reject(send, 401, "Missing or invalid request signature headers")
            return

        if (
            not nonce
            or not supplied_signature
            or abs(time.time() - request_time) > self.max_age_seconds
        ):
            await self._reject(send, 401, "Missing or expired request signature")
            return

        path = scope.get("raw_path", scope.get("path", "").encode("utf-8"))
        message = (
            scope["method"].upper().encode()
            + path
            + timestamp.encode()
            + nonce.encode()
            + body
        )
        expected_signature = hmac.new(self.secret_key, message, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_signature, supplied_signature):
            await self._reject(send, 401, "Invalid request signature")
            return

        if self.redis is None:
            await self._reject(send, 503, "Request replay protection is unavailable")
            return
        try:
            reserved = await self.redis.set(
                f"layer1:nonce:{nonce}",
                "1",
                ex=self.max_age_seconds,
                nx=True,
            )
        except Exception:
            await self._reject(send, 503, "Request replay protection is unavailable")
            return
        if not reserved:
            await self._reject(send, 409, "Request nonce has already been used")
            return

        replayed = False

        async def replay_body() -> dict:
            nonlocal replayed
            if replayed:
                return {"type": "http.request", "body": b"", "more_body": False}
            replayed = True
            return {"type": "http.request", "body": body, "more_body": False}

        await self.app(scope, replay_body, send)

    @staticmethod
    async def _read_body(receive: Receive) -> bytes:
        chunks: list[bytes] = []
        while True:
            message = await receive()
            chunks.append(message.get("body", b""))
            if not message.get("more_body", False):
                return b"".join(chunks)

    @staticmethod
    async def _reject(send: Send, status: int, detail: str) -> None:
        body = json.dumps({"detail": detail}).encode("utf-8")
        await send(_response(status, body))
        await send({"type": "http.response.body", "body": body})