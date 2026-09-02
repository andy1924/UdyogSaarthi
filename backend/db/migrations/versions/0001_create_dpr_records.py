"""create dpr_records table

Revision ID: 0001
Revises:
Create Date: 2026-09-02
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dpr_records",
        sa.Column("id", sa.String(20), primary_key=True, comment="e.g. DPR-A1B2C3D4"),
        sa.Column("applicant_name", sa.String(200), nullable=False),
        sa.Column("business_name", sa.String(200), nullable=False),
        sa.Column("business_category", sa.String(100), nullable=False),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="generated",
            comment="generated | verified | archived",
        ),
        sa.Column(
            "verified",
            sa.String(30),
            nullable=False,
            server_default="self-reported",
            comment="self-reported | aa-verified",
        ),
        sa.Column(
            "pdf_path",
            sa.String(500),
            nullable=True,
            comment="Filesystem path to generated PDF",
        ),
        sa.Column(
            "dpr_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            comment="Full 7-section DPR data payload",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Index for listing by status (e.g., "generated", "verified")
    op.create_index("ix_dpr_records_status", "dpr_records", ["status"])
    # Index for filtering by business category
    op.create_index("ix_dpr_records_business_category", "dpr_records", ["business_category"])
    # Index for ordering by creation date
    op.create_index("ix_dpr_records_created_at", "dpr_records", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_dpr_records_created_at", table_name="dpr_records")
    op.drop_index("ix_dpr_records_business_category", table_name="dpr_records")
    op.drop_index("ix_dpr_records_status", table_name="dpr_records")
    op.drop_table("dpr_records")
