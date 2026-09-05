"""Defensive response headers for the Layer 1 security overlay."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

Send = Callable[[dict], Awaitable[None]]

SECURITY_HEADERS = [
    (b"content-security-policy", b"default-src 'self'"),
    (b"x-frame-options", b"DENY"),
    (b"x-content-type-options", b"nosniff"),
    (b"strict-transport-security", b"max-age=31536000; includeSubDomains"),
    (b"referrer-policy", b"no-referrer"),
]


class Layer1HeadersMiddleware:
    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def add_headers(message: dict) -> None:
            if message["type"] == "http.response.start":
                existing = list(message.get("headers", []))
                existing_names = {name.lower() for name, _ in existing}
                message = dict(message)
                message["headers"] = existing + [
                    header for header in SECURITY_HEADERS if header[0] not in existing_names
                ]
            await send(message)

        await self.app(scope, receive, add_headers)