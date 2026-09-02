from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Iterable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    delta = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.now(UTC) + delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    try:
        user_uuid = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise credentials_exception from exc

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


class RequireRole:
    """Dependency callable that enforces RBAC on a route.

    Usage::

        @router.get("/admin")
        async def admin(user: User = Depends(RequireRole(["dic_officer", "sca_auditor"]))):
            ...
    """

    def __init__(self, allowed_roles: Iterable[str]):
        self.allowed_roles = set(allowed_roles)

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this action",
            )
        return user


# ── Convenience RBAC singletons ───────────────────────────────────────────────
# Use these directly as FastAPI dependencies instead of constructing RequireRole
# inline — keeps route declarations readable and enforces consistency.

#: Any authenticated user (applicant, dic_officer, or sca_auditor)
require_authenticated = RequireRole(["applicant", "dic_officer", "sca_auditor"])

#: Applicants only
require_applicant = RequireRole(["applicant"])

#: Field officers (DIC) and bank reviewers (SCA) — back-office staff
require_any_staff = RequireRole(["dic_officer", "sca_auditor"])

#: DIC field officers only
require_dic_officer = RequireRole(["dic_officer"])

#: SCA bank reviewers only (read audit logs, etc.)
require_sca_auditor = RequireRole(["sca_auditor"])


async def log_audit_action(
    db_session: AsyncSession,
    user: User | None,
    action: str,
    payload: dict[str, Any] | None,
    ip: str | None,
    endpoint: str | None = None,
) -> None:
    """Write an immutable audit row.

    ``user`` may be ``None`` when called from the AuditMiddleware for
    unauthenticated requests — in that case ``user_id`` is stored as NULL.
    When called from an authenticated route handler, ``user`` must be provided.
    """
    payload = payload.copy() if isinstance(payload, dict) else {}
    _ep_from_payload = payload.get("endpoint") if isinstance(payload.get("endpoint"), str) else None
    endpoint = endpoint or _ep_from_payload or "unknown"
    payload["endpoint"] = endpoint

    db_session.add(
        AuditLog(
            user_id=user.id if user is not None else None,
            action=action,
            endpoint=endpoint,
            payload_snapshot=payload,
            ip_address=ip,
        )
    )
    await db_session.commit()
