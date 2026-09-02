"""Pydantic schemas for authentication and user management."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegisterIn(BaseModel):
    """Payload for POST /auth/register."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str | None = Field(None, max_length=200)
    username: str | None = Field(None, max_length=120)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class UserOut(BaseModel):
    """Safe public representation of a User — never exposes hashed_password."""

    id: str
    email: str
    username: str | None
    full_name: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """OAuth2-compatible token response."""

    access_token: str
    token_type: str = "bearer"
