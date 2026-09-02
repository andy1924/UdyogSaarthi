"""DPR workflow transition router.

Exposes two endpoints:
  POST /api/dpr/{dpr_id}/transition  — trigger a state transition
  GET  /api/dpr/{dpr_id}/history     — read the immutable transition history

RBAC is strictly enforced: each trigger has an allowed set of roles defined
in ``dpr_fsm.TRANSITIONS``.  Attempting a forbidden transition returns 403.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, log_audit_action
from app.models.dpr import DPRRecord
from app.models.user import User
from app.services.workflow.dpr_fsm import (
    apply_transition,
    check_transition_allowed,
    get_allowed_triggers,
    make_history_entry,
)

router = APIRouter(prefix="/api/dpr", tags=["workflow"])


class TransitionRequest(BaseModel):
    action: str  # FSM trigger name e.g. "submit_for_review"
    note: str = ""  # Optional free-text note stored in history


@router.post("/{dpr_id}/transition", summary="Trigger a DPR workflow state transition")
async def transition_dpr(
    dpr_id: str,
    body: TransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Advance the DPR workflow state machine.

    Access is controlled per-trigger by the RBAC table in ``dpr_fsm.py``.
    Rejected/Finalized DPRs are terminal — no transitions are permitted.

    Returns the updated state and full history list.
    """
    # Fetch record
    result = await db.execute(select(DPRRecord).where(DPRRecord.id == dpr_id))
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail=f"DPR {dpr_id} not found")

    current_state = record.workflow_state or "draft"

    # RBAC + FSM validation
    ok, reason = check_transition_allowed(
        current_state=current_state,
        trigger=body.action,
        user_role=current_user.role,
    )
    if not ok:
        raise HTTPException(status_code=403, detail=reason)

    # Apply transition
    new_state = apply_transition(current_state, body.action)

    # Build history entry and append (treat JSONB list as append-only)
    history_entry = make_history_entry(
        from_state=current_state,
        to_state=new_state,
        trigger=body.action,
        by_user_id=str(current_user.id),
        note=body.note,
    )
    current_history: list = list(record.workflow_history or [])
    current_history.append(history_entry)

    # Persist
    record.workflow_state = new_state
    record.workflow_history = current_history
    await db.commit()
    await db.refresh(record)

    # Audit
    await log_audit_action(
        db_session=db,
        action=f"DPR_TRANSITION_{body.action.upper()}",
        endpoint=f"/api/dpr/{dpr_id}/transition",
        user=current_user,
        payload={
            "dpr_id": dpr_id,
            "from_state": current_state,
            "to_state": new_state,
            "note": body.note,
        },
    )

    return {
        "dpr_id": dpr_id,
        "previous_state": current_state,
        "current_state": new_state,
        "triggered_by": current_user.email,
        "history": current_history,
    }


@router.get("/{dpr_id}/history", summary="Read DPR workflow history")
async def get_dpr_history(
    dpr_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return the immutable workflow event history for a DPR.

    All authenticated roles can read history. The JSONB column is append-only
    at the application layer (the PostgreSQL immutability rules protect
    ``audit_logs`` but not ``dpr_records`` — history immutability is enforced
    by the application: no endpoint exists to delete or edit history entries).
    """
    result = await db.execute(select(DPRRecord).where(DPRRecord.id == dpr_id))
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail=f"DPR {dpr_id} not found")

    current_state = record.workflow_state or "draft"
    return {
        "dpr_id": dpr_id,
        "current_state": current_state,
        "allowed_triggers": get_allowed_triggers(current_state),
        "history": record.workflow_history or [],
    }
