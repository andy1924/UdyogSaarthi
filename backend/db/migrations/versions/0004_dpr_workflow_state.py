"""Add workflow_state, workflow_history, and owner_user_id to dpr_records.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-02

This migration adds three columns to the existing ``dpr_records`` table:
  - ``workflow_state``   — current FSM state string (default: 'draft')
  - ``workflow_history`` — JSONB array of transition events (append-only)
  - ``owner_user_id``   — FK to users.id (the applicant who created the DPR)

Existing rows receive workflow_state='draft' and workflow_history='[]'
via column defaults, so the migration is backward-compatible.

The existing ``status`` column (generated/verified/archived) is preserved
unchanged for backward compatibility with the DPR renderer.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "dpr_records",
        sa.Column(
            "workflow_state",
            sa.String(30),
            nullable=False,
            server_default="draft",
            comment=(
                "FSM state: draft | sca_review | dic_approved | "
                "bank_review | rejected | finalized"
            ),
        ),
    )
    op.add_column(
        "dpr_records",
        sa.Column(
            "workflow_history",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
            comment="Append-only list of {from, to, trigger, by_user_id, timestamp, note}",
        ),
    )
    op.add_column(
        "dpr_records",
        sa.Column(
            "owner_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            comment="The applicant user who submitted this DPR",
        ),
    )

    # Index for filtering DPRs by workflow state (e.g. all 'bank_review' items)
    op.create_index("ix_dpr_records_workflow_state", "dpr_records", ["workflow_state"])
    # Index for DPR owner lookup
    op.create_index("ix_dpr_records_owner_user_id", "dpr_records", ["owner_user_id"])


def downgrade() -> None:
    op.drop_index("ix_dpr_records_owner_user_id", table_name="dpr_records")
    op.drop_index("ix_dpr_records_workflow_state", table_name="dpr_records")
    op.drop_column("dpr_records", "owner_user_id")
    op.drop_column("dpr_records", "workflow_history")
    op.drop_column("dpr_records", "workflow_state")
