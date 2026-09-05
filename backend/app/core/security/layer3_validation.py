"""Reusable strict validation and sanitization helpers for service boundaries."""

from __future__ import annotations

import re
from typing import TypeVar

from pydantic import BaseModel, ConfigDict, field_validator

T = TypeVar("T", bound=BaseModel)
_SCRIPT_TAG = re.compile(r"<\s*/?\s*script\b[^>]*>", re.IGNORECASE)
_EVENT_ATTRIBUTE = re.compile(r"\bon[a-z]+\s*=", re.IGNORECASE)


class StrictBoundaryModel(BaseModel):
    """Base model for new boundary schemas that reject unknown fields."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SafeTextMixin:
    """Pydantic validator mixin for bounded, non-script text fields."""

    @field_validator("*", mode="before")
    @classmethod
    def reject_unsafe_text(cls, value):
        if not isinstance(value, str):
            return value
        if _SCRIPT_TAG.search(value) or _EVENT_ATTRIBUTE.search(value):
            raise ValueError("unsafe markup is not permitted")
        return value.strip()


def sanitize_text(value: str, *, max_length: int = 500) -> str:
    """Reject script/event markup and enforce a strict text length bound."""
    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise ValueError(f"text exceeds maximum length of {max_length}")
    if _SCRIPT_TAG.search(cleaned) or _EVENT_ATTRIBUTE.search(cleaned):
        raise ValueError("unsafe markup is not permitted")
    return cleaned


def bounded_int(value: int, *, minimum: int, maximum: int) -> int:
    """Validate an actual integer against inclusive bounds."""
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("value must be an integer")
    if not minimum <= value <= maximum:
        raise ValueError(f"value must be between {minimum} and {maximum}")
    return value


def bounded_float(value: float, *, minimum: float, maximum: float) -> float:
    """Validate a finite numeric value against inclusive bounds."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("value must be numeric")
    numeric = float(value)
    if numeric != numeric or numeric in {float("inf"), float("-inf")}:
        raise ValueError("value must be finite")
    if not minimum <= numeric <= maximum:
        raise ValueError(f"value must be between {minimum} and {maximum}")
    return numeric


def validate_boundary_model(model_type: type[T], payload: dict) -> T:
    """Validate a payload through a strict Pydantic boundary model."""
    return model_type.model_validate(payload)


__all__ = [
    "SafeTextMixin",
    "StrictBoundaryModel",
    "bounded_float",
    "bounded_int",
    "sanitize_text",
    "validate_boundary_model",
]
