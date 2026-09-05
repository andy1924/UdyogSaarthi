"""Composition entry point for the Layer 4 data vault overlay."""

from __future__ import annotations

from fastapi import FastAPI

from app.core.security.layer4_crypto import default_kms
from app.core.security.layer4_rls import clear_rls_context, set_rls_context


def setup_layer4_security(app: FastAPI) -> None:
    """Expose the KMS manager and explicit RLS context helpers on app state."""
    app.state.layer4_kms = default_kms()
    app.state.set_rls_context = set_rls_context
    app.state.clear_rls_context = clear_rls_context


__all__ = ["setup_layer4_security"]
