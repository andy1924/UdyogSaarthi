from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from app.models.user import User

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class AuditLog(Base):
    """Immutable compliance ledger for security and governance events.

    DB-level immutability is enforced by a PostgreSQL RULE that silently
    converts any DELETE on this table into a no-op (see Alembic migration
    0001_initial_schema). Standard API routes expose no DELETE method.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        # Chronological descending index for paginated audit log queries.
        Index("ix_audit_logs_timestamp_desc", "timestamp", postgresql_using="btree"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # user_id is nullable: middleware may record unauthenticated failed attempts
    # (e.g. a login failure) where no authenticated User object exists yet.
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
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

    user: Mapped["User | None"] = relationship(back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id!r} action={self.action!r} user_id={self.user_id!r}>"
