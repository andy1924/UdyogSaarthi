"""JWT lifecycle helpers for Layer 2 identity protection."""

from __future__ import annotations

from datetime import UTC, datetime

from jose import JWTError, jwt
from redis.asyncio import Redis


class Layer2JWTError(ValueError):
    """Raised when a token cannot be trusted by the identity overlay."""


async def revoke_token(redis_client: Redis, jti: str, ttl: int) -> None:
    """Revoke a token identifier until its natural expiry."""
    if not jti or ttl <= 0:
        return
    await redis_client.set(f"revoked:{jti}", "1", ex=ttl)


async def is_token_revoked(redis_client: Redis, jti: str) -> bool:
    return bool(await redis_client.exists(f"revoked:{jti}"))


def token_ttl(expiry: int | float) -> int:
    return max(0, int(expiry - datetime.now(UTC).timestamp()))


async def decode_active_token(
    token: str,
    secret_key: str,
    algorithm: str,
    redis_client: Redis,
) -> dict:
    """Decode and validate required identity claims and revocation state."""
    try:
        claims = jwt.decode(token, secret_key, algorithms=[algorithm])
    except JWTError as exc:
        raise Layer2JWTError("Invalid or expired access token") from exc

    subject = claims.get("sub")
    role = claims.get("role")
    jti = claims.get("jti")
    token_version = claims.get("token_version")
    expiry = claims.get("exp")
    if not all(isinstance(value, str) and value for value in (subject, role, jti)):
        raise Layer2JWTError("Access token is missing required identity claims")
    if not isinstance(token_version, int) or isinstance(token_version, bool):
        raise Layer2JWTError("Access token is missing required lifecycle claims")
    if not isinstance(expiry, (int, float)) or token_ttl(expiry) <= 0:
        raise Layer2JWTError("Access token is expired")
    try:
        if await is_token_revoked(redis_client, jti):
            raise Layer2JWTError("Access token has been revoked")
    except Layer2JWTError:
        raise
    except Exception as exc:
        raise Layer2JWTError("Token revocation service is unavailable") from exc
    return claims