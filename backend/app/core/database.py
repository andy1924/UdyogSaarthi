from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from db.base import Base

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    # Keep-alive probe: recycles connections that silently dropped at the TCP layer.
    pool_pre_ping=True,
    # Tunable via env vars — see Settings for documentation on each param.
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


__all__ = ["Base", "AsyncSessionLocal", "engine", "get_db"]
