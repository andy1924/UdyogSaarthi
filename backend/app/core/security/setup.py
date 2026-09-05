"""Composition entry point for the opt-in Layer 1 security overlay."""

from __future__ import annotations

from fastapi import FastAPI
from redis.asyncio import Redis

from app.core.config import settings
from app.core.security.layer1_headers import Layer1HeadersMiddleware
from app.core.security.layer1_hmac import Layer1HMACMiddleware
from app.core.security.layer1_ratelimit import Layer1RateLimitMiddleware


def setup_layer1_security(app: FastAPI) -> None:
    """Attach Layer 1 middleware using the configured secret and Redis instance.

    Call this once immediately after constructing the FastAPI application.
    Redis is shared by nonce replay protection and rate limiting.
    """
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    app.add_middleware(
        Layer1HMACMiddleware,
        secret_key=settings.secret_key,
        redis_client=redis_client,
    )
    app.add_middleware(Layer1RateLimitMiddleware, redis_client=redis_client)
    app.add_middleware(Layer1HeadersMiddleware)