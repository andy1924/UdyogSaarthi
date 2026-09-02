"""Read-only audit log router.

Provides paginated access to the immutable audit trail.
Only DIC officers and SCA auditors may query logs \u2014 applicants are forbidden.
No DELETE, PUT, or PATCH methods are defined on this router by design.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_any_staff
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/logs", summary="List audit log entries (staff only)")
async def list_audit_logs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=200, description="Entries per page"),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_any_staff),
) -> dict:
    """Return a paginated, chronologically descending view of audit logs.

    Access is restricted to ``dic_officer`` and ``sca_auditor`` roles.
    This endpoint is intentionally read-only \u2014 no mutation methods exist.
    """
    offset = (page - 1) * page_size
    stmt = (
        select(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "count": len(logs),
        "logs": [
            {
                "id": str(entry.id),
                "user_id": str(entry.user_id) if entry.user_id else None,
                "action": entry.action,
                "endpoint": entry.endpoint,
                "ip_address": entry.ip_address,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
                "payload_snapshot": entry.payload_snapshot,
            }
            for entry in logs
        ],
    }


@router.get("/logs/dpr/{dpr_id}", summary="Audit trail for a specific DPR (staff only)")
async def audit_logs_for_dpr(
    dpr_id: str,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_any_staff),
) -> dict:
    """Return all audit events associated with a specific DPR ID.

    Filters ``payload_snapshot`` JSONB for any entry that references the
    given ``dpr_id`` in the ``generate`` or ``render`` actions.
    """
    # Use PostgreSQL JSONB containment operator via text filter on payload.
    stmt = (
        select(AuditLog)
        .where(
            AuditLog.payload_snapshot["dpr_id"].as_string() == dpr_id,
        )
        .order_by(desc(AuditLog.timestamp))
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "dpr_id": dpr_id,
        "count": len(logs),
        "logs": [
            {
                "id": str(entry.id),
                "user_id": str(entry.user_id) if entry.user_id else None,
                "action": entry.action,
                "endpoint": entry.endpoint,
                "ip_address": entry.ip_address,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            }
            for entry in logs
        ],
    }


@router.get("/logs/user/{user_id}", summary="Audit trail for a specific user (staff only)")
async def audit_logs_for_user(
    user_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_any_staff),
) -> dict:
    """Return paginated audit events for a specific user UUID."""
    offset = (page - 1) * page_size
    stmt = (
        select(AuditLog)
        .where(AuditLog.user_id == user_id)
        .order_by(desc(AuditLog.timestamp))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "user_id": str(user_id),
        "page": page,
        "page_size": page_size,
        "count": len(logs),
        "logs": [
            {
                "id": str(entry.id),
                "action": entry.action,
                "endpoint": entry.endpoint,
                "ip_address": entry.ip_address,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            }
            for entry in logs
        ],
    }
