"""Auth router — login, register, and current-user profile."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    log_audit_action,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse, UserOut, UserRegisterIn

router = APIRouter(prefix="/auth", tags=["auth"])


# ── POST /auth/token ─────────────────────────────────────────────────────────


@router.post("/token", response_model=TokenResponse, summary="OAuth2 password login")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email + password, receive a JWT access token."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token = create_access_token({"sub": str(user.id), "role": user.role})

    await log_audit_action(
        db_session=db,
        user=user,
        action="USER_LOGIN",
        payload={"email": user.email, "role": user.role},
        ip=request.client.host if request.client else None,
        endpoint=str(request.url.path),
    )

    return TokenResponse(access_token=access_token)


# ── POST /auth/register ───────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Self-register as an Applicant",
)
async def register(
    request: Request,
    body: UserRegisterIn,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Create a new user account with role=applicant.

    Email must be unique. Password is bcrypt-hashed before storage.
    """
    new_user = User(
        email=body.email,
        hashed_password=get_password_hash(body.password),
        full_name=body.full_name,
        username=body.username,
        role=UserRole.APPLICANT.value,
        is_active=True,
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    await log_audit_action(
        db_session=db,
        user=new_user,
        action="USER_REGISTERED",
        payload={"email": new_user.email, "role": new_user.role},
        ip=request.client.host if request.client else None,
        endpoint=str(request.url.path),
    )

    return UserOut(
        id=str(new_user.id),
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────


@router.get("/me", response_model=UserOut, summary="Get current user profile")
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Return the profile of the currently authenticated user."""
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
