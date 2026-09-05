"""SQLAlchemy ORM model for persisted DPR (Detailed Project Report) records."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class DPRRecord(Base):
    """Persisted DPR record with full payload, PDF path, and workflow state."""

    __tablename__ = "dpr_records"

    id: Mapped[str] = mapped_column(
        String(20), primary_key=True, comment="e.g. DPR-A1B2C3D4"
    )
    applicant_name: Mapped[str] = mapped_column(String(200), nullable=False)
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    business_category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="queued", index=True,
        comment="queued | ready | pdf_failed (legacy: generated | verified | archived)",
    )
    verified: Mapped[str] = mapped_column(
        String(30), nullable=False, default="self-reported",
        comment="self-reported | aa-verified",
    )
    pdf_path: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="Filesystem path to generated PDF"
    )
    dpr_payload: Mapped[dict] = mapped_column(
        JSONB, nullable=False, comment="Full 7-section DPR data payload"
    )
    # ── Workflow FSM columns (added in migration 0004) ─────────────────────────────
    workflow_state: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
        index=True,
        comment="FSM state: draft | sca_review | dic_approved | bank_review | rejected | finalized",
    )
    workflow_history: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        comment="Append-only list of {from, to, trigger, by_user_id, timestamp, note}",
    )
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="The applicant user who submitted this DPR",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<DPRRecord id={self.id!r} status={self.status!r} "
            f"workflow_state={self.workflow_state!r}>"
        )
