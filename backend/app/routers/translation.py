"""Bounded UI translation proxy. Provider credentials never reach the browser."""

import asyncio
from collections import OrderedDict
from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.core.config import settings

router = APIRouter(prefix="/api/translation", tags=["translation"])
SARVAM_URL = "https://api.sarvam.ai/translate"
SARVAM_LANGUAGES = {
    "as": "as-IN", "bn": "bn-IN", "brx": "brx-IN", "doi": "doi-IN",
    "gu": "gu-IN", "hi": "hi-IN", "kn": "kn-IN", "ks": "ks-IN",
    "kok": "kok-IN", "mai": "mai-IN", "ml": "ml-IN", "mni": "mni-IN",
    "mr": "mr-IN", "ne": "ne-IN", "or": "od-IN", "pa": "pa-IN",
    "sa": "sa-IN", "sat": "sat-IN", "sd": "sd-IN", "ta": "ta-IN",
    "te": "te-IN", "ur": "ur-IN",
}
_cache: OrderedDict[tuple[str, str], str] = OrderedDict()
_sarvam_semaphore = asyncio.Semaphore(4)


class TranslationIn(BaseModel):
    target: str = Field(pattern=r"^[a-z]{2,3}$")
    texts: list[Annotated[str, Field(min_length=1, max_length=1900)]] = Field(
        min_length=1, max_length=80
    )

    @model_validator(mode="after")
    def bounded_text(self):
        if sum(map(len, self.texts)) > 16000:
            raise ValueError("Translation batch exceeds 16000 characters")
        return self


@router.get("/languages")
async def languages():
    if not settings.sarvam_api_key:
        return {"available": False, "languages": ["en"]}
    return {"available": True, "languages": ["en", *SARVAM_LANGUAGES]}


@router.post("/text")
async def translate(body: TranslationIn):
    if body.target == "en":
        return {"texts": body.texts}
    if not settings.sarvam_api_key:
        raise HTTPException(503, "Translation is not configured. English is available.")
    target = SARVAM_LANGUAGES.get(body.target)
    if not target:
        raise HTTPException(422, "This language is not supported by Sarvam.")
    try:
        # One pooled client amortises connection setup across a page. The
        # semaphore protects the provider when several browser sessions switch
        # languages at the same time.
        async with httpx.AsyncClient(timeout=30) as client:
            async def translate_one(value: str) -> str:
                cached = _cache.get((body.target, value))
                if cached:
                    return cached
                last_error: Exception | None = None
                for attempt in range(3):
                    try:
                        async with _sarvam_semaphore:
                            response = await client.post(
                                SARVAM_URL,
                                headers={"api-subscription-key": settings.sarvam_api_key},
                                json={
                                    "input": value,
                                    "source_language_code": "en-IN",
                                    "target_language_code": target,
                                    "speaker_gender": "Female",
                                    "mode": "formal",
                                    "model": "mayura:v1",
                                    "enable_preprocessing": True,
                                },
                            )
                        response.raise_for_status()
                        translated_value = response.json()["translated_text"]
                        if (
                            not isinstance(translated_value, str)
                            or not translated_value.strip()
                        ):
                            raise ValueError("Invalid Sarvam response")
                        _cache[(body.target, value)] = translated_value
                        if len(_cache) > 2048:
                            _cache.popitem(last=False)
                        return translated_value
                    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
                        last_error = exc
                        if attempt < 2:
                            await asyncio.sleep(0.25 * (attempt + 1))
                raise last_error or RuntimeError("Sarvam translation failed")

            translated = await asyncio.gather(*(translate_one(value) for value in body.texts))
        return {"texts": translated}
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(502, "Sarvam translation failed. Please try again.") from exc
