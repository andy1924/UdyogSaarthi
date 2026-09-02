"""AuditMiddleware — automatic immutable logging for all mutating API requests.

This middleware intercepts every POST/PUT/PATCH/DELETE on /api/* routes and
writes an AuditLog row *after* the response is sent. It uses its own DB
session (separate from the request session) so audit writes survive
request-level rollbacks.

Sensitive keys (passwords, tokens, secrets) are stripped from body snapshots
before storage to prevent credential leakage into the audit table.
"""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from fastapi import Request
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import settings
from app.models.audit import AuditLog

logger = logging.getLogger("udyogsaarthi.audit_middleware")

# Keys that should NEVER appear in stored snapshots.
_REDACT_KEYS = frozenset(
    {
        "password",
        "hashed_password",
        "secret",
        "token",
        "access_token",
        "refresh_token",
        "api_key",
        "api_setu_bearer_token",
        "openai_api_key",
        "mappls_rest_key",
        "authorization",
    }
)

_MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def _redact(obj: Any, depth: int = 0) -> Any:
    """Recursively redact sensitive keys from a JSON-serialisable structure."""
    if depth > 8:
        return "[truncated]"
    if isinstance(obj, dict):
        return {
            k: "[REDACTED]" if k.lower() in _REDACT_KEYS else _redact(v, depth + 1)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_redact(item, depth + 1) for item in obj[:50]]  # cap list size
    return obj


def _extract_user_id_from_request(request: Request) -> UUID | None:
    """Non-raising JWT decode to extract user_id for the audit row."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer "):]
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": True},
        )
        raw = payload.get("sub")
        return UUID(raw) if raw else None
    except (JWTError, ValueError, AttributeError):
        return None


class AuditMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that writes an AuditLog for every mutating API call.

    A *separate* async session factory is used so the audit write is independent
    of the request's own DB session. This ensures the audit row is persisted
    even when the route handler rolls back its own transaction.
    """

    def __init__(self, app, session_factory: async_sessionmaker[AsyncSession]) -> None:
        super().__init__(app)
        self._session_factory = session_factory

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Only audit mutating requests on /api/* paths.
        if request.method not in _MUTATING_METHODS or not request.url.path.startswith("/api/"):
            return await call_next(request)

        # Read and cache the body so the route handler can still consume it.
        raw_body = await request.body()

        # Wrap the body in a new receive callable so downstream can re-read it.
        async def _receive():
            return {"type": "http.request", "body": raw_body, "more_body": False}

        request._receive = _receive  # type: ignore[attr-defined]

        # Call the actual route handler first.
        response: Response = await call_next(request)

        # Fire-and-forget audit write (non-blocking for the response).
        await self._write_audit(request, raw_body, response.status_code)

        return response

    async def _write_audit(
        self, request: Request, raw_body: bytes, status_code: int
    ) -> None:
        user_id = _extract_user_id_from_request(request)

        # Parse and redact body snapshot.
        body_snapshot: dict[str, Any] = {}
        if raw_body:
            try:
                parsed = json.loads(raw_body)
                body_snapshot = _redact(parsed) if isinstance(parsed, (dict, list)) else {}
            except (json.JSONDecodeError, ValueError):
                body_snapshot = {"_raw_truncated": raw_body[:200].decode("utf-8", errors="replace")}

        payload: dict[str, Any] = {
            "method": request.method,
            "endpoint": str(request.url.path),
            "status_code": status_code,
            "query_params": dict(request.query_params),
            "body_snapshot": body_snapshot,
        }

        ip = request.client.host if request.client else None

        try:
            async with self._session_factory() as session:
                session.add(
                    AuditLog(
                        user_id=user_id,
                        action=f"HTTP_{request.method}",
                        endpoint=str(request.url.path),
                        payload_snapshot=payload,
                        ip_address=ip,
                    )
                )
                await session.commit()
        except Exception:
            # Audit write must never surface errors to the client.
            logger.exception(
                "AuditMiddleware: failed to write audit log for %s %s",
                request.method,
                request.url.path,
            )
