from fastapi import APIRouter
from app.core.scheme import (
    SCHEME_RULES, RULE_VERSION, EFFECTIVE_FROM,
    compute_tpc, max_loan_raw, capped_loan, working_capital_buffer, generate_eqi_schedule,
)
from app.schemas.scheme import SchemeCalculateIn, SchemeCalculateOut, SchemeRulesOut

router = APIRouter(prefix="/api/scheme", tags=["scheme"])

@router.get("/rules", response_model=list[SchemeRulesOut])
def get_rules():
    out = []
    for tier, r in SCHEME_RULES.items():
        out.append(SchemeRulesOut(tier=tier, cap=r["cap"], rate=r["rate"], tenure_years=r["tenure_y"], moratorium_months=r["moratorium_m"], effective_from=EFFECTIVE_FROM, version=RULE_VERSION))
    return out

@router.post("/calculate", response_model=SchemeCalculateOut)
def calculate(inp: SchemeCalculateIn):
    tpc = compute_tpc(inp.margin)
    raw = max_loan_raw(tpc)
    capped, tier, rule = capped_loan(tpc)
    schedule, emi = generate_eqi_schedule(capped, rule["rate"], rule["tenure_y"], rule["moratorium_m"])
    return SchemeCalculateOut(
        margin=inp.margin,
        tpc=tpc,
        max_loan_raw=raw,
        max_loan_capped=capped,
        tier=tier,
        rules=SchemeRulesOut(tier=tier, cap=rule["cap"], rate=rule["rate"], tenure_years=rule["tenure_y"], moratorium_months=rule["moratorium_m"], effective_from=EFFECTIVE_FROM, version=RULE_VERSION),
        working_capital_buffer=working_capital_buffer(capped),
        eqi_schedule=[{**s} for s in schedule],
        eqi_amount=emi,
    )
