"""Document the PDF failure status on DPR records.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-02
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "dpr_records",
        "status",
        comment="generated | verified | archived | pdf_failed",
    )


def downgrade() -> None:
    op.alter_column(
        "dpr_records",
        "status",
        comment="generated | verified | archived",
    )
