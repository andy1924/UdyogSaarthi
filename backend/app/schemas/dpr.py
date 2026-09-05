from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.feasibility import FeasibilityOut
from app.schemas.scheme import SchemeCalculateOut


class DPRGenerateIn(BaseModel):
    feasibility: FeasibilityOut
    scheme: SchemeCalculateOut
    capex_opex: dict | None = Field(None, description="{capex, opex, notes}")
    verified: Literal["self-reported", "aa-verified"] = "self-reported"
    applicant_name: str = "Applicant"
    business_name: str | None = None


class DPRGenerateOut(BaseModel):
    dpr_id: str
    pdf_url: str
    # Render only returns queued (or pdf_failed if dispatch fails). `ready` is
    # returned by GET /api/dpr/{id} after the worker writes the PDF.
    status: Literal["queued", "pdf_failed"] = "queued"
    data: dict
    verified: str
