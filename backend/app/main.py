from __future__ import annotations

from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from redis import Redis

app = FastAPI(title="UdyogSaarthi API", version="0.1.0")


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    db_ok = False
    redis_ok = False

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    try:
        redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
        redis_client.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status": "ok" if db_ok and redis_ok else "degraded",
        "database": "up" if db_ok else "down",
        "redis": "up" if redis_ok else "down",
    }
