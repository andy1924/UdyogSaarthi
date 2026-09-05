"""Composition entry point for the Layer 3 application boundary overlay."""

from __future__ import annotations

from fastapi import FastAPI

from app.core.config import settings
from app.core.security.layer3_boundary import Layer3BoundaryMiddleware
from app.core.security.layer3_exceptions import (
    CorrelationIDMiddleware,
    configure_logging,
    sanitized_exception_handler,
)


def setup_layer3_security(app: FastAPI) -> None:
    """Attach correlation IDs, sanitized errors, and the route boundary."""
    configure_logging()
    app.state.debug = settings.debug
    app.add_exception_handler(Exception, sanitized_exception_handler)
    app.add_middleware(Layer3BoundaryMiddleware)
    app.add_middleware(CorrelationIDMiddleware)
