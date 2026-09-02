from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from app.models.audit import AuditLog

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class UserRole(str, Enum):
    APPLICANT = "applicant"
    DIC_OFFICER = "dic_officer"
    SCA_AUDITOR = "sca_auditor"


class User(Base):
    """Application user for authentication and RBAC."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(
        String(120), unique=True, index=True, nullable=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=UserRole.APPLICANT.value,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=func.now()
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r} role={self.role!r}>"
