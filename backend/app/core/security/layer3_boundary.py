"""Deny-by-default path boundary for routes without an explicit policy."""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Iterable

Send = Callable[[dict], Awaitable[None]]

_DEFAULT_PUBLIC_PATHS = frozenset({
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/scheme/rules",
})
_DEFAULT_KNOWN_PREFIXES = ("/auth/", "/api/")


def public_endpoint(endpoint):
    """Mark an endpoint for use by a routing-aware boundary integration."""
    endpoint.layer3_public = True
    return endpoint


class Layer3BoundaryMiddleware:
    """Reject unknown paths while preserving existing route-level auth policies.

    FastAPI resolves endpoints downstream of ASGI middleware. Existing API paths
    therefore delegate to their established Layer 2 dependencies; unknown paths
    are denied here before they can reach application code.
    """

    def __init__(
        self,
        app,
        public_paths: Iterable[str] = _DEFAULT_PUBLIC_PATHS,
        known_prefixes: Iterable[str] = _DEFAULT_KNOWN_PREFIXES,
    ) -> None:
        self.app = app
        self.public_paths = frozenset(public_paths)
        self.known_prefixes = tuple(known_prefixes)

    async def __call__(self, scope: dict, receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path = scope.get("path", "")
        if path in self.public_paths or path.startswith(self.known_prefixes):
            await self.app(scope, receive, send)
            return
        await self._reject(send, 403, "Route is not authorized by the application boundary")

    @staticmethod
    async def _reject(send: Send, status: int, detail: str) -> None:
        body = json.dumps({"detail": detail}).encode("utf-8")
        headers = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body)).encode()),
        ]
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": body})


__all__ = ["Layer3BoundaryMiddleware", "public_endpoint"]
