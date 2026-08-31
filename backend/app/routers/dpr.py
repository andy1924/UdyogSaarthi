import uuid

from fastapi import APIRouter

from app.schemas.dpr import DPRGenerateIn, DPRGenerateOut

router = APIRouter(prefix="/api/dpr", tags=["dpr"])


@router.post("/render", response_model=DPRGenerateOut)
def render(inp: DPRGenerateIn):
    dpr_id = f"DPR-{uuid.uuid4().hex[:8].upper()}"
    # numbers already validated in scheme — just echo
    data = {
        "applicant": inp.applicant_name,
        "business": inp.business_name or inp.feasibility.business_category,
        "location": inp.feasibility.lgd.model_dump(),
        "feasibility": inp.feasibility.model_dump(),
        "scheme": inp.scheme.model_dump(),
        "capex_opex": inp.capex_opex,
        "verified": inp.verified,
        "sections": [
            "Cover",
            "Feasibility",
            "Scheme Structure",
            "CAPEX/OPEX",
            "EQI Schedule",
            "License Checklist",
            "Declaration",
        ],
    }
    # In full impl this would enqueue Celery + write S3 via WeasyPrint; here sync mock
    return DPRGenerateOut(
        dpr_id=dpr_id,
        pdf_url=f"/mock/{dpr_id}.pdf",
        status="ready",
        data=data,
        verified=inp.verified,
    )


@router.get("/{dpr_id}")
def get_dpr(dpr_id: str):
    return {"dpr_id": dpr_id, "status": "ready", "pdf_url": f"/mock/{dpr_id}.pdf"}
