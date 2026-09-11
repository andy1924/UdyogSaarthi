"""Bounded UI translation proxy. Provider credentials never reach the browser."""

import asyncio
import time
from collections import OrderedDict
from typing import Annotated
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.core.config import settings

router = APIRouter(prefix="/api/translation", tags=["translation"])
CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
SARVAM_URL = "https://api.sarvam.ai/translate"
SARVAM_LANGUAGES = {
    "as": "as-IN", "bn": "bn-IN", "brx": "brx-IN", "doi": "doi-IN",
    "gu": "gu-IN", "hi": "hi-IN", "kn": "kn-IN", "ks": "ks-IN",
    "kok": "kok-IN", "mai": "mai-IN", "ml": "ml-IN", "mni": "mni-IN",
    "mr": "mr-IN", "ne": "ne-IN", "or": "od-IN", "pa": "pa-IN",
    "sa": "sa-IN", "sat": "sat-IN", "sd": "sd-IN", "ta": "ta-IN",
    "te": "te-IN", "ur": "ur-IN",
}
_config: dict = {}
_expires = 0.0
_lock = asyncio.Lock()
_cache: OrderedDict[tuple[str, str], str] = OrderedDict()


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


async def configuration() -> dict:
    global _config, _expires
    if not all((settings.bhashini_user_id, settings.bhashini_api_key,
                settings.bhashini_pipeline_id)):
        raise HTTPException(503, "Translation is not configured. English is available.")
    async with _lock:
        if time.monotonic() < _expires:
            return _config
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(CONFIG_URL, headers={
                    "userID": settings.bhashini_user_id,
                    "ulcaApiKey": settings.bhashini_api_key,
                }, json={
                    "pipelineTasks": [{"taskType": "translation"}],
                    "pipelineRequestConfig": {"pipelineId": settings.bhashini_pipeline_id},
                })
                response.raise_for_status()
                data = response.json()
            services = {
                item["language"]["targetLanguage"]: item["serviceId"]
                for task in data["pipelineResponseConfig"]
                if task["taskType"] == "translation"
                for item in task["config"]
                if item["language"]["sourceLanguage"] == "en"
            }
            endpoint = data["pipelineInferenceAPIEndPoint"]
            url = urlparse(endpoint["callbackUrl"])
            if url.scheme != "https" or not (url.hostname or "").endswith(".bhashini.gov.in"):
                raise ValueError("Unexpected inference host")
            _config = {"services": services, "endpoint": endpoint}
            _expires = time.monotonic() + 1800
            return _config
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise HTTPException(502, "Translation provider is temporarily unavailable.") from exc


@router.get("/languages")
async def languages():
    if settings.sarvam_api_key:
        return {"available": True, "languages": ["en", *SARVAM_LANGUAGES]}
    try:
        config = await configuration()
        return {"available": True, "languages": sorted({"en", *config["services"]})}
    except HTTPException:
        return {"available": False, "languages": ["en"]}


@router.post("/text")
async def translate(body: TranslationIn):
    if body.target == "en":
        return {"texts": body.texts}
    if settings.sarvam_api_key:
        target = SARVAM_LANGUAGES.get(body.target)
        if not target:
            raise HTTPException(422, "This language is not supported by Sarvam.")
        try:
            translated: list[str] = []
            async with httpx.AsyncClient(timeout=30) as client:
                for value in body.texts:
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
                    translated.append(response.json()["translated_text"])
            return {"texts": translated}
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise HTTPException(502, "Sarvam translation failed. Please try again.") from exc
    config = await configuration()
    service = config["services"].get(body.target)
    if not service:
        raise HTTPException(422, "This language is not supported by the configured pipeline.")
    missing = list(dict.fromkeys(t for t in body.texts if (body.target, t) not in _cache))
    resolved = {t: _cache[(body.target, t)] for t in body.texts if (body.target, t) in _cache}
    if missing:
        endpoint = config["endpoint"]
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(endpoint["callbackUrl"], headers={
                    endpoint["inferenceApiKey"]["name"]: endpoint["inferenceApiKey"]["value"],
                }, json={
                    "pipelineTasks": [{"taskType": "translation", "config": {
                        "language": {"sourceLanguage": "en", "targetLanguage": body.target},
                        "serviceId": service,
                    }}],
                    "inputData": {"input": [{"source": value} for value in missing]},
                })
                response.raise_for_status()
                result = response.json()["pipelineResponse"][0]["output"]
            if len(result) != len(missing):
                raise ValueError("Incomplete translation")
            translated = [row["target"] for row in result]
            if not all(isinstance(value, str) and value.strip() for value in translated):
                raise ValueError("Invalid translation")
            for source, value in zip(missing, translated, strict=True):
                resolved[source] = value
                _cache[(body.target, source)] = value
                if len(_cache) > 2048:
                    _cache.popitem(last=False)
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise HTTPException(502, "Translation failed. Please try again.") from exc
    return {"texts": [resolved[text] for text in body.texts]}
