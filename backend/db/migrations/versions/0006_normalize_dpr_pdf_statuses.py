"""Document normalized DPR PDF statuses.

Revision ID: 0006_normalize_dpr_pdf_statuses
Revises: 0005_update_dpr_status_comment
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_normalize_dpr_pdf_statuses"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "dpr_records",
        "status",
        existing_type=sa.String(length=30),
        existing_nullable=False,
        comment="queued | ready | pdf_failed (legacy: generated | verified | archived)",
    )


def downgrade() -> None:
    op.alter_column(
        "dpr_records",
        "status",
        existing_type=sa.String(length=30),
        existing_nullable=False,
        comment="generated | verified | archived | pdf_failed",
    )
