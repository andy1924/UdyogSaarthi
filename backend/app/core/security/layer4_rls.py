"""PostgreSQL transaction-local RLS context helpers and policy templates."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

RLS_POLICY_SQL = """
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_scope ON users
    USING (id = NULLIF(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY dpr_owner_scope ON dpr_records
    USING (
        owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        OR current_setting('app.role', true) IN ('dic_officer', 'sca_auditor')
    );
"""


def _context_value(value: str | UUID, field: str) -> str:
    normalized = str(value)
    if not normalized or "\x00" in normalized:
        raise ValueError(f"invalid RLS {field}")
    return normalized


async def set_rls_context(
    session: AsyncSession,
    *,
    user_id: str | UUID,
    role: str,
) -> None:
    """Set transaction-local identity variables on an active PostgreSQL session."""
    safe_user_id = _context_value(user_id, "user_id")
    safe_role = _context_value(role, "role")
    await session.execute(
        text("SELECT set_config('app.user_id', :user_id, true)"),
        {"user_id": safe_user_id},
    )
    await session.execute(
        text("SELECT set_config('app.role', :role, true)"),
        {"role": safe_role},
    )


async def clear_rls_context(session: AsyncSession) -> None:
    """Clear transaction-local identity variables before reuse or explicit tests."""
    await session.execute(text("SELECT set_config('app.user_id', '', true)"))
    await session.execute(text("SELECT set_config('app.role', '', true)"))


__all__ = ["RLS_POLICY_SQL", "clear_rls_context", "set_rls_context"]
