"""
DPR (Detailed Project Report) router — Stage 3 (PDF + DB persistence).

Generates a print-ready PDF via WeasyPrint, persists the DPR record to
PostgreSQL, and serves the file via a download endpoint.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, log_audit_action
from app.models.dpr import DPRRecord
from app.models.user import User
from app.schemas.dpr import DPRGenerateIn, DPRGenerateOut
from app.services.dpr_ai_service import generate_swot
from app.services.kyc_service import verify_applicant
from app.services.pdf_service import generate_dpr_pdf

logger = logging.getLogger("udyogsaarthi.dpr_router")

router = APIRouter(prefix="/api/dpr", tags=["dpr"])


# ── POST /api/dpr/render ─────────────────────────────────────────────


@router.post("/render", response_model=DPRGenerateOut)
async def render(
    request: Request,
    inp: DPRGenerateIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DPRGenerateOut:
    dpr_id = f"DPR-{uuid.uuid4().hex[:8].upper()}"
    payload_snapshot = {
        "business_name": inp.business_name,
        "applicant_name": inp.applicant_name,
        "feasibility": inp.feasibility.model_dump() if inp.feasibility else None,
        "scheme": inp.scheme.model_dump() if inp.scheme else None,
        "capex_opex": inp.capex_opex,
        "verified": inp.verified,
    }
    await log_audit_action(
        db_session=db,
        user=user,
        action="GENERATE_DPR",
        payload={"request": payload_snapshot, "dpr_id": dpr_id},
        ip=request.client.host if request.client else None,
        endpoint=request.url.path,
    )

    # ── Derive values from input ─────────────────────────────────
    business_name = inp.business_name or inp.feasibility.business_category
    location_text = (
        f"{inp.feasibility.lgd.block}, "
        f"{inp.feasibility.lgd.district}, "
        f"{inp.feasibility.lgd.state}"
    )
    loan_amount = inp.scheme.max_loan_capped

    # ── Concurrent AI SWOT + KYC fetch ───────────────────────────
    swot_result, kyc_result = await asyncio.gather(
        generate_swot(
            business_name=business_name,
            business_category=inp.feasibility.business_category,
            location_text=location_text,
            poi_count=inp.feasibility.poi_count,
            verdict=inp.feasibility.verdict,
            loan_amount=loan_amount,
        ),
        verify_applicant(),
    )

    # ── Determine verification status ────────────────────────────
    verified = "aa-verified" if kyc_result.verified else inp.verified

    # ── Assemble full DPR data payload ───────────────────────────
    data = {
        "applicant": inp.applicant_name,
        "business": business_name,
        "location": inp.feasibility.lgd.model_dump(),
        "feasibility": inp.feasibility.model_dump(),
        "scheme": inp.scheme.model_dump(),
        "capex_opex": inp.capex_opex,
        "verified": verified,
        "kyc": kyc_result.model_dump(),
        "swot": swot_result.model_dump(),
        "sections": [
            "Cover",
            "Feasibility",
            "SWOT Analysis",
            "Scheme Structure",
            "CAPEX/OPEX",
            "Compliance & Licenses",
            "Declaration & Verification",
        ],
    }

    # ── Generate PDF ─────────────────────────────────────────────
    pdf_path: str | None = None
    try:
        pdf_path = await generate_dpr_pdf(dpr_id=dpr_id, dpr_payload=data)
    except Exception as exc:
        logger.error("PDF generation failed for %s: %s — continuing without PDF", dpr_id, exc)

    # ── Persist to PostgreSQL ────────────────────────────────────
    try:
        record = DPRRecord(
            id=dpr_id,
            applicant_name=inp.applicant_name,
            business_name=business_name,
            business_category=inp.feasibility.business_category,
            status="generated",
            verified=verified,
            pdf_path=pdf_path,
            dpr_payload=data,
        )
        db.add(record)
        await db.commit()
        logger.info("DPR record %s persisted to PostgreSQL", dpr_id)
    except Exception as exc:
        await db.rollback()
        logger.warning(
            "Failed to persist DPR %s to DB (%s) — returning response anyway",
            dpr_id,
            exc,
        )

    # ── Build response ───────────────────────────────────────────
    pdf_url = f"/api/dpr/{dpr_id}/download" if pdf_path else f"/mock/{dpr_id}.pdf"

    response = DPRGenerateOut(
        dpr_id=dpr_id,
        pdf_url=pdf_url,
        status="ready",
        data=data,
        verified=verified,
    )

    await log_audit_action(
        db_session=db,
        user=user,
        action="DPR_RENDERED",
        payload={
            "request": payload_snapshot,
            "response": {
                "dpr_id": response.dpr_id,
                "pdf_url": response.pdf_url,
                "status": response.status,
                "verified": response.verified,
            },
        },
        ip=request.client.host if request.client else None,
        endpoint=request.url.path,
    )

    return response


# ── GET /api/dpr/{dpr_id} ────────────────────────────────────────────


@router.get("/{dpr_id}")
async def get_dpr(dpr_id: str, db: AsyncSession = Depends(get_db)):
    """Return DPR metadata from PostgreSQL."""
    stmt = select(DPRRecord).where(DPRRecord.id == dpr_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(status_code=404, detail=f"DPR {dpr_id} not found")

    pdf_url = f"/api/dpr/{dpr_id}/download" if record.pdf_path else f"/mock/{dpr_id}.pdf"

    return {
        "dpr_id": record.id,
        "applicant_name": record.applicant_name,
        "business_name": record.business_name,
        "business_category": record.business_category,
        "status": record.status,
        "verified": record.verified,
        "pdf_url": pdf_url,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "data": record.dpr_payload,
    }


# ── GET /api/dpr/{dpr_id}/download ───────────────────────────────────


@router.get("/{dpr_id}/download")
async def download_dpr(dpr_id: str, db: AsyncSession = Depends(get_db)):
    """Serve the actual generated PDF file."""
    stmt = select(DPRRecord).where(DPRRecord.id == dpr_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(status_code=404, detail=f"DPR {dpr_id} not found")

    if not record.pdf_path:
        raise HTTPException(status_code=404, detail=f"PDF not yet generated for {dpr_id}")

    pdf_file = Path(record.pdf_path)
    if not pdf_file.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"PDF file missing from disk for {dpr_id}",
        )

    return FileResponse(
        path=str(pdf_file),
        media_type="application/pdf",
        filename=f"{dpr_id}.pdf",
        headers={"Content-Disposition": f'attachment; filename="{dpr_id}.pdf"'},
    )
