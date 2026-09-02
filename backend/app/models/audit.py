from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from app.models.user import User

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class AuditLog(Base):
    """Immutable compliance ledger for security and governance events."""

    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    payload_snapshot: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    user: Mapped["User"] = relationship(back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id!r} action={self.action!r} user_id={self.user_id!r}>"
