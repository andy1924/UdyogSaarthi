"""Reusable role and DPR object-scope guards for Layer 2."""

from __future__ import annotations

from collections.abc import Iterable
from uuid import UUID

from fastapi import HTTPException, Request, status


class RequireRole:
    """FastAPI dependency that authorizes roles from the injected identity."""

    def __init__(self, allowed_roles: Iterable[str]):
        self.allowed_roles = frozenset(allowed_roles)

    def __call__(self, request: Request) -> dict:
        identity = getattr(request.state, "identity", None)
        if not identity or identity.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return identity


def verify_dpr_ownership(
    user_id: str | UUID,
    role: str,
    dpr_id: str,
    *,
    owner_user_id: str | UUID | None = None,
    assigned_user_id: str | UUID | None = None,
) -> bool:
    """Return whether an identity may access a loaded DPR object.

    Callers must load the DPR by ``dpr_id`` and pass its owner/assignment values;
    absent scope data fails closed. This helper performs no database access.
    """
    del dpr_id
    normalized_user = str(user_id)
    if role == "applicant":
        return owner_user_id is not None and str(owner_user_id) == normalized_user
    if role in {"dic_officer", "sca_auditor"}:
        return assigned_user_id is not None and str(assigned_user_id) == normalized_user
    return False