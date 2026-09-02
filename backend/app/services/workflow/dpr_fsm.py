"""DPR workflow state machine.

States and allowed transitions:

    draft
      └─ submit_for_review  → sca_review       (applicant, dic_officer)
    sca_review
      ├─ approve_sca         → dic_approved     (dic_officer)
      └─ reject              → rejected         (dic_officer, sca_auditor)
    dic_approved
      └─ send_to_bank        → bank_review      (dic_officer)
    bank_review
      ├─ finalize            → finalized        (sca_auditor)
      └─ reject              → rejected         (sca_auditor)
    rejected          (terminal — no further transitions)
    finalized         (terminal — no further transitions)

Any state → rejected via force_reject  (sca_auditor only)

RBAC is enforced at the router layer via ``check_transition_allowed()``.
The FSM itself just guards valid state paths.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

# pyrefly: ignore [missing-import]
from transitions import Machine

# ── State definitions ────────────────────────────────────────────────

STATES = [
    "draft",
    "sca_review",
    "dic_approved",
    "bank_review",
    "rejected",
    "finalized",
]

# Terminal states — no transitions out of these.
TERMINAL_STATES = {"rejected", "finalized"}

# ── Transition table ─────────────────────────────────────────────────
# Each entry: {trigger, source, dest, allowed_roles}
# allowed_roles is consumed by the router RBAC check, not by transitions lib.

TRANSITIONS: list[dict[str, Any]] = [
    {
        "trigger": "submit_for_review",
        "source": "draft",
        "dest": "sca_review",
        "allowed_roles": {"applicant", "dic_officer"},
        "label": "Submit for SCA Review",
    },
    {
        "trigger": "approve_sca",
        "source": "sca_review",
        "dest": "dic_approved",
        "allowed_roles": {"dic_officer"},
        "label": "SCA Approved → DIC",
    },
    {
        "trigger": "reject",
        "source": "sca_review",
        "dest": "rejected",
        "allowed_roles": {"dic_officer", "sca_auditor"},
        "label": "Rejected at SCA Review",
    },
    {
        "trigger": "send_to_bank",
        "source": "dic_approved",
        "dest": "bank_review",
        "allowed_roles": {"dic_officer"},
        "label": "Sent to Bank Review",
    },
    {
        "trigger": "finalize",
        "source": "bank_review",
        "dest": "finalized",
        "allowed_roles": {"sca_auditor"},
        "label": "Finalized by Bank",
    },
    {
        "trigger": "reject",
        "source": "bank_review",
        "dest": "rejected",
        "allowed_roles": {"sca_auditor"},
        "label": "Rejected at Bank Review",
    },
    {
        "trigger": "force_reject",
        "source": list(STATES),   # from any state
        "dest": "rejected",
        "allowed_roles": {"sca_auditor"},
        "label": "Force Rejected (SCA override)",
    },
]

# Build a lookup: trigger → allowed_roles (used by RBAC check in router)
_TRIGGER_ROLES: dict[str, set[str]] = {}
for _t in TRANSITIONS:
    _TRIGGER_ROLES[_t["trigger"]] = _t["allowed_roles"]  # type: ignore[assignment]


# ── FSM factory ──────────────────────────────────────────────────────


class _DPRModel:
    """Internal stateful object used by the transitions machine."""

    def __init__(self, state: str) -> None:
        self.state = state


def build_machine(current_state: str) -> _DPRModel:
    """Create a transitions Machine seeded with *current_state*.

    Usage::

        m = build_machine("draft")
        m.submit_for_review()   # succeeds
        assert m.state == "sca_review"
        m.submit_for_review()   # raises MachineError — invalid transition
    """
    model = _DPRModel(state=current_state)
    Machine(
        model=model,
        states=STATES,
        transitions=[
            {
                "trigger": t["trigger"],
                "source": t["source"],
                "dest": t["dest"],
            }
            for t in TRANSITIONS
        ],
        initial=current_state,
        auto_transitions=False,
        ignore_invalid_triggers=False,  # raise on invalid transition
    )
    return model


# ── Public helpers ────────────────────────────────────────────────────


def get_allowed_triggers(state: str) -> list[str]:
    """Return the list of valid trigger names from *state*."""
    triggers = []
    for t in TRANSITIONS:
        src = t["source"]
        sources: list[str] = src if isinstance(src, list) else [src]
        if state in sources:
            triggers.append(t["trigger"])
    return triggers


def check_transition_allowed(
    current_state: str,
    trigger: str,
    user_role: str,
) -> tuple[bool, str]:
    """Validate that *trigger* is legal from *current_state* for *user_role*.

    Returns ``(ok: bool, reason: str)``.
    ``reason`` is a human-readable string explaining the denial.
    """
    if current_state in TERMINAL_STATES:
        return False, f"DPR is in a terminal state '{current_state}' — no further transitions."

    valid_triggers = get_allowed_triggers(current_state)
    if trigger not in valid_triggers:
        return False, (
            f"Trigger '{trigger}' is not valid from state '{current_state}'. "
            f"Valid triggers: {valid_triggers}"
        )

    allowed_roles = _TRIGGER_ROLES.get(trigger, set())
    if user_role not in allowed_roles:
        return False, (
            f"Role '{user_role}' is not permitted to trigger '{trigger}'. "
            f"Allowed roles: {sorted(allowed_roles)}"
        )

    return True, ""


def apply_transition(current_state: str, trigger: str) -> str:
    """Execute the state machine and return the new state.

    Raises ``transitions.MachineError`` if the transition is invalid.
    Call ``check_transition_allowed()`` first for a clean error message.
    """
    model = build_machine(current_state)
    getattr(model, trigger)()
    return model.state


def make_history_entry(
    from_state: str,
    to_state: str,
    trigger: str,
    by_user_id: str,
    note: str | None,
) -> dict[str, Any]:
    """Build a structured history event for JSONB storage."""
    return {
        "from": from_state,
        "to": to_state,
        "trigger": trigger,
        "by_user_id": by_user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": note or "",
    }
