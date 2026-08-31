from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.routers.compliance import router as compliance_router
from app.routers.directory import router as directory_router
from app.routers.dpr import router as dpr_router
from app.routers.feasibility import router as feasibility_router
from app.routers.scheme import router as scheme_router

app = FastAPI(
    title="UdyogSaarthi API",
    version="0.1.0",
    description="Deterministic scheme math + KYN feasibility + DPR + compliance/directory (mocked LGD/OSM, auditable rules v2024-11)",
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)
app.include_router(scheme_router)
app.include_router(feasibility_router)
app.include_router(dpr_router)
app.include_router(compliance_router)
app.include_router(directory_router)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    import asyncio

    async def _db():
        try:
            async with asyncio.timeout(0.8):
                async with AsyncSessionLocal() as session:
                    await session.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    async def _redis():
        try:
            def _ping():
                c = Redis.from_url(
                    settings.redis_url, decode_responses=True, socket_connect_timeout=0.6, socket_timeout=0.6
                )
                c.ping()
                c.close()

            await asyncio.wait_for(asyncio.to_thread(_ping), timeout=0.9)
            return True
        except Exception:
            return False

    try:
        async with asyncio.timeout(1.6):
            db_ok, redis_ok = await asyncio.gather(_db(), _redis())
    except asyncio.TimeoutError:
        db_ok, redis_ok = False, False
    return {
        "status": "ok" if db_ok and redis_ok else "degraded",
        "database": "up" if db_ok else "down",
        "redis": "up" if redis_ok else "down",
    }
