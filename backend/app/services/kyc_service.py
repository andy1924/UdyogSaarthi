"""
Async KYC verification service — DigiLocker Sandbox via API Setu.

Fetches mock user identity data from the Meri Pehchaan sandbox endpoint.
Returns a structured verification result; gracefully degrades when the
sandbox is offline so DPR generation is never blocked.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.kyc_service")

# ── Constants ────────────────────────────────────────────────────────

_DIGILOCKER_USER_URL = "https://dev-meripehchaan.gov.in/public/oauth2/1/user"
_KYC_TIMEOUT = 4.0  # seconds


# ── Response model ───────────────────────────────────────────────────


class KYCResult(BaseModel):
    """Normalised identity verification payload embedded in the DPR."""

    verified: bool = False
    digilocker_id: str = ""
    name: str = ""
    dob: str = ""
    gender: str = ""
    eaadhaar_linked: bool = False
    error: str | None = None


# ── Fallback ─────────────────────────────────────────────────────────

_FALLBACK = KYCResult(
    verified=False,
    error="KYC verification unavailable — sandbox unreachable",
)


# ── Public API ───────────────────────────────────────────────────────


async def verify_applicant() -> KYCResult:
    """
    Call the DigiLocker sandbox to retrieve mock user identity data.

    Returns a :class:`KYCResult` on success, or a safe fallback payload
    when the sandbox is down / token is invalid.
    """
    token = settings.api_setu_bearer_token
    if not token:
        logger.debug("API_SETU_BEARER_TOKEN not configured — skipping KYC")
        return KYCResult(verified=False, error="API Setu bearer token not configured")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=_KYC_TIMEOUT) as client:
            resp = await client.get(_DIGILOCKER_USER_URL, headers=headers)

        if resp.status_code != 200:
            logger.warning(
                "DigiLocker sandbox returned HTTP %d — using fallback",
                resp.status_code,
            )
            return KYCResult(
                verified=False,
                error=f"DigiLocker returned HTTP {resp.status_code}",
            )

        data: dict[str, Any] = resp.json()

        return KYCResult(
            verified=True,
            digilocker_id=str(data.get("digilockerid", "")),
            name=str(data.get("name", "")),
            dob=str(data.get("dob", "")),
            gender=str(data.get("gender", "")),
            eaadhaar_linked=data.get("eaadhaar", "N") == "Y",
        )

    except (httpx.TimeoutException, httpx.HTTPError) as exc:
        logger.warning("DigiLocker request failed (%s) — using fallback", exc)
        return KYCResult(verified=False, error=str(exc))
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("DigiLocker response parsing error (%s)", exc)
        return KYCResult(verified=False, error=f"Response parse error: {exc}")
