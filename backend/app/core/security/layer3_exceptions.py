"""Correlation IDs and sanitized exception responses for Layer 3."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from uuid import uuid4

from fastapi import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("udyogsaarthi.security.layer3")
Send = Callable[[dict], Awaitable[None]]


class CorrelationIDMiddleware:
    """Attach a correlation ID to every HTTP request and response."""

    def __init__(self, app, header_name: str = "X-Correlation-ID") -> None:
        self.app = app
        self.header_name = header_name

    async def __call__(self, scope: dict, receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        supplied = headers.get(self.header_name.lower().encode(), b"").decode("ascii", "ignore")
        correlation_id = supplied or str(uuid4())
        scope.setdefault("state", {})["correlation_id"] = correlation_id

        async def send_with_correlation(message: dict) -> None:
            if message["type"] == "http.response.start":
                response_headers = list(message.get("headers", []))
                response_headers.append(
                    (self.header_name.lower().encode(), correlation_id.encode())
                )
                message = {**message, "headers": response_headers}
            await send(message)

        await self.app(scope, receive, send_with_correlation)


async def sanitized_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log details internally and return only safe tracking data to clients."""
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    logger.error(
        "Unhandled exception correlation_id=%s path=%s",
        correlation_id,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    if getattr(request.app.state, "debug", False):
        detail = "Internal server error"
    else:
        detail = "Internal server error"
    return JSONResponse(
        status_code=500,
        content={"detail": detail, "correlation_id": correlation_id},
        headers={"X-Correlation-ID": correlation_id},
    )


def configure_logging() -> None:
    """Provide a useful default logger without exposing exception details."""
    logging.getLogger("udyogsaarthi.security.layer3").setLevel(logging.INFO)


__all__ = ["CorrelationIDMiddleware", "configure_logging", "sanitized_exception_handler"]
