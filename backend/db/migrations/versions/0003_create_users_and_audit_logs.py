"""Create users and audit_logs tables with RBAC and immutable audit ledger.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-02

This migration:
  1. Creates the ``users`` table with role-based access control columns.
  2. Creates the ``audit_logs`` table with a nullable FK to users.
  3. Applies a PostgreSQL RULE that silently converts DELETE on audit_logs
     to a no-op \u2014 providing DB-level immutability for the audit ledger.
  4. Adds a descending index on audit_logs.timestamp for efficient pagination.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(120), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=True),
        sa.Column(
            "role",
            sa.String(30),
            nullable=False,
            server_default="applicant",
            comment="applicant | dic_officer | sca_auditor",
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
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    # ── audit_logs ────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        # Nullable FK: unauthenticated attempts are recorded with user_id=NULL.
        # ON DELETE SET NULL: if a user is deleted, audit rows are preserved
        # but the FK is cleared \u2014 the ledger remains intact.
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("endpoint", sa.String(255), nullable=False),
        sa.Column(
            "payload_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("ip_address", sa.String(45), nullable=True),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    # Descending index for efficient reverse-chronological pagination.
    op.execute(
        "CREATE INDEX ix_audit_logs_timestamp_desc ON audit_logs (timestamp DESC);"
    )

    # ── Immutability RULE ─────────────────────────────────────────────────
    # Convert any DELETE on audit_logs into a no-op at the database level.
    # This means even a superuser running DELETE FROM audit_logs via the app
    # connection will silently succeed with 0 rows affected.
    # Physical deletion requires dropping this rule (a deliberate, auditable act).
    op.execute(
        """
        CREATE RULE no_delete_audit AS
            ON DELETE TO audit_logs
            DO INSTEAD NOTHING;
        """
    )

    # ── UPDATE guard ──────────────────────────────────────────────────────
    # Prevent row mutations as well \u2014 audit logs should only ever be appended.
    op.execute(
        """
        CREATE RULE no_update_audit AS
            ON UPDATE TO audit_logs
            DO INSTEAD NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DROP RULE IF EXISTS no_update_audit ON audit_logs;")
    op.execute("DROP RULE IF EXISTS no_delete_audit ON audit_logs;")
    op.drop_index("ix_audit_logs_timestamp_desc", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
