"""Shared authentication utilities and perimeter security middleware."""

from app.core.security.legacy import (
	RequireRole,
	create_access_token,
	get_current_user,
	get_password_hash,
	log_audit_action,
	oauth2_scheme,
	pwd_context,
	require_any_staff,
	require_applicant,
	require_authenticated,
	require_dic_officer,
	require_sca_auditor,
	verify_password,
)
from app.core.security.setup import setup_layer1_security

__all__ = [
	"RequireRole",
	"create_access_token",
	"get_current_user",
	"get_password_hash",
	"log_audit_action",
	"oauth2_scheme",
	"pwd_context",
	"require_any_staff",
	"require_applicant",
	"require_authenticated",
	"require_dic_officer",
	"require_sca_auditor",
	"setup_layer1_security",
	"verify_password",
]