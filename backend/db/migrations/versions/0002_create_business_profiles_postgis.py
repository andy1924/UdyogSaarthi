"""create business profiles with postgis

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-02
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.create_table(
        "business_profiles",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column(
            "location",
            Geography(geometry_type="POINT", srid=4326, spatial_index=True),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_business_profiles_name", "business_profiles", ["name"])
    op.create_index("ix_business_profiles_category", "business_profiles", ["category"])
    op.create_index("ix_business_profiles_is_active", "business_profiles", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_business_profiles_is_active", table_name="business_profiles")
    op.drop_index("ix_business_profiles_category", table_name="business_profiles")
    op.drop_index("ix_business_profiles_name", table_name="business_profiles")
    op.drop_table("business_profiles")
    op.execute("DROP EXTENSION IF EXISTS postgis;")
