"""Composition entry point for the Layer 2 identity overlay."""

from __future__ import annotations

from fastapi import FastAPI
from redis.asyncio import Redis

from app.core.config import settings
from app.core.security.layer2_auth_middleware import Layer2AuthMiddleware


def setup_layer2_security(app: FastAPI) -> None:
    """Attach JWT validation and identity context injection to the app."""
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    app.add_middleware(
        Layer2AuthMiddleware,
        secret_key=settings.secret_key,
        algorithm=settings.jwt_algorithm,
        redis_client=redis_client,
    )