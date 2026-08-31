from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SchemeRulesOut(BaseModel):
    tier: Literal["micro", "term"]
    cap: int
    rate: float
    tenure_years: int
    moratorium_months: int
    effective_from: str = "2024-11-01"
    version: str = "v2024-11"


class SchemeCalculateIn(BaseModel):
    margin: float = Field(
        ..., ge=5000, le=5_000_000, description="Margin capital in INR (5000-50L)"
    )
    business_category: str | None = None


class QuarterlyObligation(BaseModel):
    quarter: int
    principal: float
    interest: float
    emi: float
    balance: float
    due_label: str


class SchemeCalculateOut(BaseModel):
    margin: float
    tpc: float
    max_loan_raw: float
    max_loan_capped: float
    tier: Literal["micro", "term"]
    rules: SchemeRulesOut
    working_capital_buffer: float
    eqi_schedule: list[QuarterlyObligation]
    eqi_amount: float | None  # regular quarterly instalment
