from __future__ import annotations

import math

# Versioned rules — mirrors frontend schemeRules + research.md §5.2
# Mirrors: frontend/src/lib/scheme/rules.ts
SCHEME_RULES = {
    "micro": {"cap": 125_000, "rate": 0.065, "tenure_y": 3, "moratorium_m": 3, "label": "Micro Finance Scheme"},
    "term": {"cap": 4_500_000, "rate": 0.08, "tenure_y": 7, "moratorium_m": 6, "label": "Term Loan Scheme"},
}
RULE_VERSION = "v2024-11"
EFFECTIVE_FROM = "2024-11-01"
TPC_THRESHOLD = 140_000  # <= micro, else term
MARGIN_RATIO = 0.10


def compute_tpc(margin: float) -> float:
    return round(margin / MARGIN_RATIO, 2)


def max_loan_raw(tpc: float) -> float:
    return round(tpc * 0.90, 2)


def route_scheme(tpc: float) -> str:
    return "micro" if tpc <= TPC_THRESHOLD else "term"


def capped_loan(tpc: float) -> tuple[float, str, dict]:
    tier = route_scheme(tpc)
    rule = SCHEME_RULES[tier]
    raw = max_loan_raw(tpc)
    capped = min(raw, rule["cap"])
    return round(capped, 2), tier, rule


def working_capital_buffer(loan: float) -> float:
    return round(loan * 0.25, 2)


def generate_eqi_schedule(loan: float, rate: float, tenure_y: int, moratorium_m: int):
    """Equal quarterly instalments after moratorium quarters. Returns list of dicts."""
    quarters_total = tenure_y * 4
    moratorium_q = math.ceil(moratorium_m / 3)
    n = quarters_total - moratorium_q  # paying quarters
    if n <= 0 or loan <= 0:
        return [], None
    r = rate / 4  # quarterly rate
    # EMI formula
    if r == 0:
        emi = round(loan / n, 2)
    else:
        emi = loan * r * (1 + r) ** n / ((1 + r) ** n - 1)
        emi = round(emi, 2)

    schedule = []
    balance = loan
    for i in range(n):
        q_num = moratorium_q + i + 1
        interest = round(balance * r, 2)
        principal = round(emi - interest, 2)
        # last quarter adjustment
        if i == n - 1:
            principal = round(balance, 2)
            interest = round(emi - principal, 2)
            if interest < 0:
                interest = 0
            emi_adj = round(principal + interest, 2)
            balance = 0
            schedule.append({
                "quarter": q_num,
                "principal": principal,
                "interest": interest,
                "emi": emi_adj,
                "balance": 0,
                "due_label": f"Q{q_num}",
            })
        else:
            balance = round(balance - principal, 2)
            schedule.append({
                "quarter": q_num,
                "principal": principal,
                "interest": interest,
                "emi": emi,
                "balance": max(balance, 0),
                "due_label": f"Q{q_num}",
            })
    return schedule, emi
