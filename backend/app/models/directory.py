from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class BusinessProfile(Base):
    """Canonical business directory record for spatial peer discovery."""

    __tablename__ = "business_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    location: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<BusinessProfile id={self.id!r} name={self.name!r} category={self.category!r}>"
